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
    return res.json(rows);
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
    return res.json(rows[0]);
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
    items,
    subtotal = 0,
    discount = 0,
    total = 0,
    paymentMethod = 'Cash',
    status = 'Completed',
    notes = ''
  } = req.body;

  try {
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      // Insert the sale
      const [result] = await connection.query(
        `INSERT INTO sales
         (invoiceId, date, customerId, customerType, items, subtotal, discount, total, paymentMethod, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoiceId, date, customerId, customerType, JSON.stringify(items), subtotal, discount, total, paymentMethod, status, notes]
      );

      // Update item stock quantities if sale is completed
      if (status === 'Completed' && Array.isArray(items)) {
        for (const item of items) {
          if (item.itemId && item.quantity) {
            // Decrease stock for each item
            await connection.query(
              'UPDATE items SET currentStock = currentStock - ? WHERE id = ? AND currentStock >= ?',
              [item.quantity, item.itemId, item.quantity]
            );

            // Record stock history for sale
            await connection.query(
              'INSERT INTO stock_history (itemId, type, quantity, reason, userId) VALUES (?, ?, ?, ?, ?)',
              [item.itemId, 'Stock Out', item.quantity, `Sale: ${invoiceId}`, null]
            );
          }
        }
      }

      await connection.commit();

      const [newSaleRows] = await db.promise().query(
        `SELECT s.*, c.name as customerName
         FROM sales s
         LEFT JOIN customers c ON s.customerId = c.id
         WHERE s.id = ?`,
        [result.insertId]
      );

      return res.status(201).json(newSaleRows[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create sale error:', error.message);
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
       invoiceId = ?, date = ?, customerId = ?, customerType = ?,
       items = ?, subtotal = ?, discount = ?, total = ?,
       paymentMethod = ?, status = ?, notes = ?
       WHERE id = ?`,
      [invoiceId, date, customerId, customerType, JSON.stringify(items), subtotal, discount, total, paymentMethod, status, notes, id]
    );

    const [rows] = await db.promise().query(
      `SELECT s.*, c.name as customerName
       FROM sales s
       LEFT JOIN customers c ON s.customerId = c.id
       WHERE s.id = ?`,
      [id]
    );

    return res.json(rows[0] || {});
  } catch (error) {
    console.error('Update sale error:', error.message);
    return res.status(500).json({ message: 'Failed to update sale', error: error.message });
  }
};

// Delete sale
exports.deleteSale = async (req, res) => {
  const { id } = req.params;
  try {
    await db.promise().query('DELETE FROM sales WHERE id = ?', [id]);
    return res.json({ message: 'Sale deleted successfully' });
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
    return res.json(rows);
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
