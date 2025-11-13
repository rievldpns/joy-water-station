const db = require('../db');

exports.createSale = async (req, res) => {
  const { customerId, customerType, transactionType, items, discount, paymentMethod, status, notes } = req.body;
  
  try {
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      // Insert sale record
      const [saleResult] = await connection.query(
        'INSERT INTO sales (customerId, customerType, transactionType, discount, total, paymentMethod, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [customerId, customerType, transactionType, discount, 0, paymentMethod, status, notes]
      );

      const saleId = saleResult.insertId;
      let total = 0;

      // Insert sale items and update inventory
      for (const item of items) {
        await connection.query(
          'INSERT INTO sale_items (saleId, itemId, quantity, price) VALUES (?, ?, ?, ?)',
          [saleId, item.itemId, item.quantity, item.price]
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
        [total - discount, saleId]
      );

      await connection.commit();
      res.status(201).json({ message: 'Sale created successfully', saleId });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSales = async (req, res) => {
  try {
    const [sales] = await db.promise().query(
      'SELECT * FROM sales ORDER BY createdAt DESC'
    );
    res.json(sales);
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSaleById = async (req, res) => {
  try {
    const [sale] = await db.promise().query(
      'SELECT * FROM sales WHERE id = ?',
      [req.params.id]
    );
    
    if (sale.length === 0) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const [items] = await db.promise().query(
      'SELECT * FROM sale_items WHERE saleId = ?',
      [req.params.id]
    );

    res.json({ ...sale[0], items });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
