const db = require('../db');

// Sample fallback items used when DB is empty or inaccessible
const sampleItems = [
  { id: 1, name: 'Water Gallon (Full)', description: 'Standard 5-gallon water', price: 35.00, currentStock: 100, minStock: 10, uom: 'pc', category: 'Water Products' },
  { id: 2, name: 'Empty Gallon', description: 'Empty 5-gallon container', price: 20.00, currentStock: 75, minStock: 10, uom: 'pc', category: 'Containers' },
  { id: 3, name: 'Lid', description: 'Gallon lid', price: 5.00, currentStock: 200, minStock: 20, uom: 'pc', category: 'Accessories' }
];

// Get all items
exports.getAllItems = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM items ORDER BY name');
    if (Array.isArray(rows) && rows.length > 0) {
      return res.json(rows);
    }
    // If table empty, attempt to return sample items (and optionally seed DB)
    try {
      // Try to seed sample items if table empty
      for (const it of sampleItems) {
        await db.promise().query(
          'INSERT IGNORE INTO items (id, name, description, price, currentStock, minStock, uom, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [it.id, it.name, it.description, it.price, it.currentStock, it.minStock, it.uom, it.category]
        );
      }
      const [afterSeed] = await db.promise().query('SELECT * FROM items ORDER BY name');
      if (Array.isArray(afterSeed) && afterSeed.length > 0) {
        return res.json(afterSeed);
      }
    } catch (seedErr) {
      // ignore seeding errors, return sampleItems
      console.warn('Seeding items failed:', seedErr.message);
    }
    return res.json(sampleItems);
  } catch (error) {
    console.error('Get items error:', error.message);
    // On DB error, return sample items so frontend can work
    return res.json(sampleItems);
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
