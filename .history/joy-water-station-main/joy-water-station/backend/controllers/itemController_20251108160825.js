const db = require('../db');

// Get all items
exports.getAllItems = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM items ORDER BY name');
    return res.json(rows);
  } catch (error) {
    console.error('Get items error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch items', error: error.message });
  }
};

// Create new item
exports.createItem = async (req, res) => {
  const { name, description = '', price = 0, currentStock = 0, minStock = 0, uom = '', category = '' } = req.body;
  try {
    const [result] = await db.promise().query(
      'INSERT INTO items (name, description, price, currentStock, minStock, uom, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, currentStock, minStock, uom, category]
    );
    const [newItemRows] = await db.promise().query('SELECT * FROM items WHERE id = ?', [result.insertId]);
    return res.status(201).json(newItemRows[0]);
  } catch (error) {
    console.error('Create item error:', error.message);
    return res.status(500).json({ message: 'Failed to create item', error: error.message });
  }
};

// Update item
exports.updateItem = async (req, res) => {
  const { id } = req.params;
  const { name, description = '', price = 0, currentStock = 0, minStock = 0, uom = '', category = '' } = req.body;
  try {
    await db.promise().query(
      'UPDATE items SET name = ?, description = ?, price = ?, currentStock = ?, minStock = ?, uom = ?, category = ? WHERE id = ?',
      [name, description, price, currentStock, minStock, uom, category, id]
    );
    const [rows] = await db.promise().query('SELECT * FROM items WHERE id = ?', [id]);
    return res.json(rows[0] || {});
  } catch (error) {
    console.error('Update item error:', error.message);
    return res.status(500).json({ message: 'Failed to update item', error: error.message });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  const { id } = req.params;
  try {
    await db.promise().query('DELETE FROM items WHERE id = ?', [id]);
    return res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error.message);
    return res.status(500).json({ message: 'Failed to delete item', error: error.message });
  }
};

// Update stock
exports.updateStock = async (req, res) => {
  const { id } = req.params;
  const { quantity = 0, type = 'increase' } = req.body;
  try {
    const [rows] = await db.promise().query('SELECT currentStock FROM items WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Item not found' });
    let newStock = rows[0].currentStock;
    if (type === 'decrease') newStock -= Math.abs(quantity);
    else newStock += Math.abs(quantity);
    if (newStock < 0) return res.status(400).json({ message: 'Insufficient stock' });
    await db.promise().query('UPDATE items SET currentStock = ? WHERE id = ?', [newStock, id]);
    return res.json({ message: 'Stock updated', currentStock: newStock });
  } catch (error) {
    console.error('Update stock error:', error.message);
    return res.status(500).json({ message: 'Failed to update stock', error: error.message });
  }
};

// Bulk update stock
exports.bulkUpdateStock = async (req, res) => {
  const updates = req.body; // Array of { id, quantity, type: 'decrease' | 'increase' }
  if (!Array.isArray(updates)) {
    return res.status(400).json({ message: 'Updates must be an array' });
  }

  try {
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      const results = [];
      for (const update of updates) {
        const { id, quantity, type = 'decrease' } = update;
        const [rows] = await connection.query('SELECT currentStock FROM items WHERE id = ?', [id]);
        if (!rows || rows.length === 0) {
          throw new Error(`Item ${id} not found`);
        }
        let newStock = rows[0].currentStock;
        if (type === 'decrease') newStock -= Math.abs(quantity);
        else newStock += Math.abs(quantity);
        if (newStock < 0) {
          throw new Error(`Insufficient stock for item ${id}`);
        }
        await connection.query('UPDATE items SET currentStock = ? WHERE id = ?', [newStock, id]);
        results.push({ id, currentStock: newStock });
      }

      await connection.commit();
      res.json({ message: 'Stock updated successfully', results });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Bulk update stock error:', error.message);
    return res.status(500).json({ message: 'Failed to update stock', error: error.message });
  }
};

// Get stock history for an item
exports.getStockHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.promise().query(
      'SELECT sh.*, u.username as userName FROM stock_history sh LEFT JOIN users u ON sh.userId = u.id WHERE sh.itemId = ? ORDER BY sh.date DESC',
      [id]
    );
    return res.json(rows);
  } catch (error) {
    console.error('Get stock history error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch stock history', error: error.message });
  }
};

// Add stock entry (manual stock in/out)
exports.addStockEntry = async (req, res) => {
  const { id } = req.params;
  const { type, quantity, reason } = req.body;
  const userId = req.user ? req.user.id : null; // Assuming auth middleware sets req.user

  if (!type || !quantity) {
    return res.status(400).json({ message: 'Type and quantity are required' });
  }

  try {
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      // Get current stock
      const [rows] = await connection.query('SELECT currentStock FROM items WHERE id = ?', [id]);
      if (!rows || rows.length === 0) {
        throw new Error('Item not found');
      }
      let newStock = rows[0].currentStock;
      if (type === 'Stock In') newStock += Math.abs(quantity);
      else if (type === 'Stock Out') newStock -= Math.abs(quantity);
      if (newStock < 0) {
        throw new Error('Insufficient stock');
      }

      // Update stock
      await connection.query('UPDATE items SET currentStock = ? WHERE id = ?', [newStock, id]);

      // Record history
      await connection.query(
        'INSERT INTO stock_history (itemId, type, quantity, reason, userId) VALUES (?, ?, ?, ?, ?)',
        [id, type, quantity, reason || null, userId]
      );

      await connection.commit();
      return res.json({ message: 'Stock entry added successfully', currentStock: newStock });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Add stock entry error:', error.message);
    return res.status(500).json({ message: 'Failed to add stock entry', error: error.message });
  }
};
