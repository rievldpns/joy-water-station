const db = require('../db');

// Get all sales
exports.getAllSales = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT s.*, c.name as customerName
       FROM sales s
       LEFT JOIN customers c ON s.customerId = c.id
       ORDER BY s.createdAt DESC`
    );
    
    // Parse JSON items for each sale
    const salesWithParsedItems = rows.map(sale => ({
      ...sale,
      items: typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items
    }));
    
    return res.json(salesWithParsedItems);
  } catch (error) {
    console.error('Get sales error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch sales', error: error.message });
  }
};

// Get sale by ID
exports.getSaleById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.promise().query(
      `SELECT s.*, c.name as customerName
       FROM sales s
       LEFT JOIN customers c ON s.customerId = c.id
       WHERE s.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    const sale = rows[0];
    sale.items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items;
    
    return res.json(sale);
  } catch (error) {
    console.error('Get sale error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch sale', error: error.message });
  }
};

// Create new sale
exports.createSale = async (req, res) => {
  const {
    invoiceId,
    date,
    customerId,
    customerType = 'Regular',
    transactionType = 'Walk-in',
    deliveryType = 'Walk-in',
    items,
    subtotal = 0,
    discount = 0,
    total = 0,
    paymentMethod = 'Cash',
    status = 'Completed',
    notes = ''
  } = req.body;

  console.log('Creating sale with data:', { invoiceId, customerId, customerType, transactionType, deliveryType, items, status });

  // Validate required fields
  if (!invoiceId || !customerId || !items || items.length === 0) {
    return res.status(400).json({ message: 'Missing required fields: invoiceId, customerId, and items are required' });
  }

  try {
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      // FIRST: Check stock availability for all items BEFORE inserting sale
      if (status === 'Completed' && Array.isArray(items)) {
        for (const item of items) {
          if (item.itemId && item.quantity) {
            const [itemRows] = await connection.query(
              'SELECT currentStock, name FROM items WHERE id = ?',
              [item.itemId]
            );
            
            if (itemRows.length === 0) {
              throw new Error(`Item with ID ${item.itemId} not found`);
            }
            
            const currentStock = itemRows[0].currentStock;
            const itemName = itemRows[0].name;
            
            if (currentStock < item.quantity) {
              throw new Error(`Insufficient stock for item: ${itemName}. Available: ${currentStock}, Requested: ${item.quantity}`);
            }
          }
        }
      }

      // SECOND: Insert the sale
      const [result] = await connection.query(
        `INSERT INTO sales
         (invoiceId, date, customerId, customerType, transactionType, deliveryType, items, subtotal, discount, total, paymentMethod, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId, 
          date, 
          customerId, 
          customerType, 
          transactionType, 
          deliveryType, 
          JSON.stringify(items), 
          subtotal, 
          discount, 
          total, 
          paymentMethod, 
          status, 
          notes
        ]
      );

      console.log('Sale inserted with ID:', result.insertId);

      // THIRD: Update item stock quantities if sale is completed
      if (status === 'Completed' && Array.isArray(items)) {
        for (const item of items) {
          if (item.itemId && item.quantity) {
            console.log('Updating stock for item:', item.itemId, 'quantity:', item.quantity);
            
            const [itemRows] = await connection.query(
              'SELECT currentStock, name FROM items WHERE id = ?',
              [item.itemId]
            );
            
            if (itemRows.length > 0) {
              const currentStock = itemRows[0].currentStock;
              const itemName = itemRows[0].name;
              const newStock = currentStock - item.quantity;
              
              console.log(`Item ${itemName}: current=${currentStock}, selling=${item.quantity}, new=${newStock}`);
              
              // Update items table
              await connection.query(
                'UPDATE items SET currentStock = ? WHERE id = ?',
                [newStock, item.itemId]
              );

              // Record stock history
              await connection.query(
                'INSERT INTO stock_history (itemId, type, quantity, reason, userId) VALUES (?, ?, ?, ?, ?)',
                [item.itemId, 'Stock Out', item.quantity, `Sale: ${invoiceId}`, null]
              );
              
              console.log('Stock updated successfully for item:', item.itemId);
            }
          }
        }
      }

      await connection.commit();
      console.log('Transaction committed successfully');

      // Fetch the created sale
      const [newSaleRows] = await db.promise().query(
        `SELECT s.*, c.name as customerName
         FROM sales s
         LEFT JOIN customers c ON s.customerId = c.id
         WHERE s.id = ?`,
        [result.insertId]
      );

      const sale = newSaleRows[0];
      sale.items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items;

      return res.status(201).json(sale);
    } catch (error) {
      await connection.rollback();
      console.error('Transaction error, rolling back:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create sale error:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({ message: 'Failed to create sale', error: error.message });
  }
};

// Update sale
exports.updateSale = async (req, res) => {
  const { id } = req.params;
  const {
    invoiceId,
    date,
    customerId,
    customerType,
    transactionType = 'Walk-in',
    deliveryType = 'Walk-in',
    items,
    subtotal,
    discount,
    total,
    paymentMethod,
    status,
    notes
  } = req.body;

  try {
    await db.promise().query(
      `UPDATE sales SET
       invoiceId = ?, date = ?, customerId = ?, customerType = ?, transactionType = ?, deliveryType = ?,
       items = ?, subtotal = ?, discount = ?, total = ?,
       paymentMethod = ?, status = ?, notes = ?
       WHERE id = ?`,
      [
        invoiceId, 
        date, 
        customerId, 
        customerType, 
        transactionType, 
        deliveryType, 
        JSON.stringify(items), 
        subtotal, 
        discount, 
        total, 
        paymentMethod, 
        status, 
        notes, 
        id
      ]
    );

    const [rows] = await db.promise().query(
      `SELECT s.*, c.name as customerName
       FROM sales s
       LEFT JOIN customers c ON s.customerId = c.id
       WHERE s.id = ?`,
      [id]
    );

    const sale = rows[0] || {};
    sale.items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items;

    return res.json(sale);
  } catch (error) {
    console.error('Update sale error:', error.message);
    return res.status(500).json({ message: 'Failed to update sale', error: error.message });
  }
};

// Delete sale
exports.deleteSale = async (req, res) => {
  const { id } = req.params;
  try {
    // Get sale details to restore stock
    const [saleRows] = await db.promise().query('SELECT * FROM sales WHERE id = ?', [id]);
    if (saleRows.length === 0) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const sale = saleRows[0];
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      // Restore stock if sale was completed
      if (sale.status === 'Completed' && sale.items) {
        const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items;
        
        for (const item of items) {
          if (item.itemId && item.quantity) {
            const [itemRows] = await connection.query(
              'SELECT currentStock FROM items WHERE id = ?',
              [item.itemId]
            );
            
            if (itemRows.length > 0) {
              await connection.query(
                'UPDATE items SET currentStock = currentStock + ? WHERE id = ?',
                [item.quantity, item.itemId]
              );

              // Record stock history
              await connection.query(
                'INSERT INTO stock_history (itemId, type, quantity, reason, userId) VALUES (?, ?, ?, ?, ?)',
                [item.itemId, 'Stock In', item.quantity, `Sale Deleted: ${sale.invoiceId}`, null]
              );
            }
          }
        }
      }

      // Delete the sale
      await connection.query('DELETE FROM sales WHERE id = ?', [id]);
      await connection.commit();

      return res.json({ message: 'Sale deleted successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Delete sale error:', error.message);
    return res.status(500).json({ message: 'Failed to delete sale', error: error.message });
  }
};

// Get sales by date range
exports.getSalesByDateRange = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const [rows] = await db.promise().query(
      `SELECT s.*, c.name as customerName
       FROM sales s
       LEFT JOIN customers c ON s.customerId = c.id
       WHERE s.date BETWEEN ? AND ?
       ORDER BY s.date DESC`,
      [startDate, endDate]
    );
    
    const salesWithParsedItems = rows.map(sale => ({
      ...sale,
      items: typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items
    }));
    
    return res.json(salesWithParsedItems);
  } catch (error) {
    console.error('Get sales by date range error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch sales', error: error.message });
  }
};

// Get sales summary
exports.getSalesSummary = async (req, res) => {
  try {
    const [summaryRows] = await db.promise().query(`
      SELECT
        COUNT(*) as totalSales,
        SUM(total) as totalRevenue,
        AVG(total) as averageSale,
        SUM(subtotal) as totalSubtotal,
        SUM(discount) as totalDiscounts
      FROM sales
      WHERE status = 'Completed'
    `);

    const [todayRows] = await db.promise().query(`
      SELECT SUM(total) as todayRevenue, COUNT(*) as todaySales
      FROM sales
      WHERE DATE(date) = CURDATE() AND status = 'Completed'
    `);

    const [monthlyRows] = await db.promise().query(`
      SELECT SUM(total) as monthlyRevenue, COUNT(*) as monthlySales
      FROM sales
      WHERE YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE()) AND status = 'Completed'
    `);

    return res.json({
      overall: summaryRows[0],
      today: todayRows[0],
      monthly: monthlyRows[0]
    });
  } catch (error) {
    console.error('Get sales summary error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch sales summary', error: error.message });
  }
};