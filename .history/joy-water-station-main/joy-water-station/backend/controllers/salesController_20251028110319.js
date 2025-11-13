const db = require('../db');

exports.createSale = async (req, res) => {
  const { customerId, customerType, transactionType, items, discount, paymentMethod, status } = req.body;

  try {
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      // Check stock availability
      for (const item of items) {
        const [stock] = await connection.query(
          'SELECT currentStock FROM inventory WHERE id = ?',
          [item.itemId]
        );
        
        if (stock[0].currentStock < item.quantity) {
          throw new Error(`Insufficient stock for item ID ${item.itemId}`);
        }
      }

      // Create sale record
      const [saleResult] = await connection.query(
        'INSERT INTO sales (customerId, customerType, transactionType, discount, total, paymentMethod, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [customerId, customerType, transactionType, discount, 0, paymentMethod, status]
      );

      // Add sale items and update inventory
      let total = 0;
      for (const item of items) {
        await connection.query(
          'INSERT INTO sale_items (saleId, itemId, quantity, price) VALUES (?, ?, ?, ?)',
          [saleResult.insertId, item.itemId, item.quantity, item.price]
        );

        if (status === 'Completed') {
          await connection.query(
            'UPDATE inventory SET currentStock = currentStock - ? WHERE id = ?',
            [item.quantity, item.itemId]
          );
        }

        total += item.quantity * item.price;
      }

      // Update sale total
      await connection.query(
        'UPDATE sales SET total = ? WHERE id = ?',
        [total - discount, saleResult.insertId]
      );

      await connection.commit();
      res.status(201).json({ 
        message: 'Sale created successfully',
        saleId: saleResult.insertId 
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.getSaleWithItems = async (req, res) => {
  try {
    const [sale] = await db.promise().query(
      'SELECT s.*, c.name as customerName FROM sales s LEFT JOIN customers c ON s.customerId = c.id WHERE s.id = ?',
      [req.params.id]
    );

    if (sale.length === 0) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const [items] = await db.promise().query(
      'SELECT si.*, i.name as itemName FROM sale_items si JOIN inventory i ON si.itemId = i.id WHERE si.saleId = ?',
      [req.params.id]
    );

    res.json({ ...sale[0], items });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
