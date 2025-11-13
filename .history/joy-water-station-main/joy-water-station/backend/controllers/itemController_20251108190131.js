const db = require('../db');

// Get all items from the 'items' table
exports.getAllItems = async (req, res) => {
  try {
    const [items] = await db.promise().query(
      'SELECT * FROM items ORDER BY name'
    );
    res.json(items);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get item by ID
exports.getItemById = async (req, res) => {
  const { id } = req.params;
  try {
    const [items] = await db.promise().query(
      'SELECT * FROM items WHERE id = ?',
      [id]
    );
    
    if (items.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json(items[0]);
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new item
exports.createItem = async (req, res) => {
  const { name, category, price, uom, currentStock, minStock, maxStock, description } = req.body;

  try {
    const [result] = await db.promise().query(
      `INSERT INTO items (name, category, price, uom, currentStock, minStock, maxStock, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category, price, uom, currentStock || 0, minStock || 0, maxStock || 0, description || '']
    );

    const [items] = await db.promise().query('SELECT * FROM items WHERE id = ?', [result.insertId]);
    res.status(201).json(items[0]);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update item details
exports.updateItem = async (req, res) => {
  const { id } = req.params;
  const { name, category, price, uom, currentStock, minStock, maxStock, description } = req.body;

  try {
    await db.promise().query(
      `UPDATE items SET 
        name = ?, 
        category = ?, 
        price = ?, 
        uom = ?, 
        currentStock = ?, 
        minStock = ?, 
        maxStock = ?, 
        description = ?
      WHERE id = ?`,
      [name, category, price, uom, currentStock, minStock, maxStock, description, id]
    );

    const [items] = await db.promise().query('SELECT * FROM items WHERE id = ?', [id]);
    res.json(items[0]);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  const { id } = req.params;
  try {
    await db.promise().query('DELETE FROM items WHERE id = ?', [id]);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update stock for a specific item (simple version)
exports.updateStock = async (req, res) => {
  const { id } = req.params;
  const { quantity, type } = req.body;

  try {
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      const [item] = await connection.query(
        'SELECT currentStock, name FROM items WHERE id = ?',
        [id]
      );

      if (item.length === 0) {
        throw new Error('Item not found');
      }

      const newStock = type === 'decrease' 
        ? item[0].currentStock - quantity 
        : item[0].currentStock + quantity;

      if (newStock < 0) {
        throw new Error(`Insufficient stock for ${item[0].name}. Available: ${item[0].currentStock}, Requested: ${quantity}`);
      }

      await connection.query(
        'UPDATE items SET currentStock = ? WHERE id = ?',
        [newStock, id]
      );

      await connection.query(
        'INSERT INTO stock_history (itemId, type, quantity, reason, userId) VALUES (?, ?, ?, ?, ?)',
        [id, type === 'decrease' ? 'Stock Out' : 'Stock In', quantity, 'Manual adjustment', null]
      );

      await connection.commit();
      res.json({ message: 'Stock updated successfully', currentStock: newStock });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Bulk update stock for multiple items
exports.bulkUpdateStock = async (req, res) => {
  const { items } = req.body; // Array of { itemId, quantity, type }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Items array is required' });
  }

  try {
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      for (const item of items) {
        const { itemId, quantity, type } = item;

        const [itemData] = await connection.query(
          'SELECT currentStock, name FROM items WHERE id = ?',
          [itemId]
        );

        if (itemData.length === 0) {
          throw new Error(`Item with ID ${itemId} not found`);
        }

        const newStock = type === 'decrease' 
          ? itemData[0].currentStock - quantity 
          : itemData[0].currentStock + quantity;

        if (newStock < 0) {
          throw new Error(`Insufficient stock for ${itemData[0].name}`);
        }

        await connection.query(
          'UPDATE items SET currentStock = ? WHERE id = ?',
          [newStock, itemId]
        );

        await connection.query(
          'INSERT INTO stock_history (itemId, type, quantity, reason, userId) VALUES (?, ?, ?, ?, ?)',
          [itemId, type === 'decrease' ? 'Stock Out' : 'Stock In', quantity, 'Bulk update', null]
        );
      }

      await connection.commit();
      res.json({ message: 'Bulk stock update successful' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Bulk update stock error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Add stock entry (for stock in/out with history tracking)
exports.addStockEntry = async (req, res) => {
  const { id } = req.params;
  const { type, quantity, reason } = req.body;

  try {
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      const [item] = await connection.query(
        'SELECT currentStock, name FROM items WHERE id = ?',
        [id]
      );

      if (item.length === 0) {
        throw new Error('Item not found');
      }

      const adjustment = type === 'Stock In' ? quantity : -quantity;
      const newStock = item[0].currentStock + adjustment;

      if (newStock < 0) {
        throw new Error(`Insufficient stock for ${item[0].name}`);
      }

      await connection.query(
        'UPDATE items SET currentStock = ? WHERE id = ?',
        [newStock, id]
      );

      await connection.query(
        'INSERT INTO stock_history (itemId, type, quantity, reason, userId) VALUES (?, ?, ?, ?, ?)',
        [id, type, quantity, reason, null]
      );

      await connection.commit();
      
      res.json({ 
        message: 'Stock entry saved successfully',
        currentStock: newStock
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Add stock entry error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get stock history for an item
exports.getStockHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const [history] = await db.promise().query(
      `SELECT sh.*, u.username as userName
       FROM stock_history sh
       LEFT JOIN users u ON sh.userId = u.id
       WHERE sh.itemId = ?
       ORDER BY sh.date DESC`,
      [id]
    );
    res.json(history);
  } catch (error) {
    console.error('Get stock history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check if items have sufficient stock
exports.checkStock = async (req, res) => {
  const { items } = req.body;
  
  try {
    const itemIds = items.map(item => item.itemId);
    
    const [inventory] = await db.promise().query(
      'SELECT id, name, currentStock FROM items WHERE id IN (?)',
      [itemIds]
    );

    const insufficientItems = [];
    const stockCheck = items.every(item => {
      const invItem = inventory.find(i => i.id === item.itemId);
      if (!invItem || invItem.currentStock < item.quantity) {
        insufficientItems.push({
          itemId: item.itemId,
          name: invItem?.name || 'Unknown',
          requested: item.quantity,
          available: invItem?.currentStock || 0
        });
        return false;
      }
      return true;
    });

    res.json({ 
      available: stockCheck,
      insufficientItems: insufficientItems
    });
  } catch (error) {
    console.error('Check stock error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};