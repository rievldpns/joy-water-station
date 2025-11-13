const db = require('../db');

// Get all items
exports.getAllItems = async (req, res) => {
  try {
    const [items] = await db.promise().query(
      'SELECT * FROM items ORDER BY name'
    );
    res.json(items);
  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).json({ message: 'Error getting items' });
  }
};

// Create new item
exports.createItem = async (req, res) => {
  const { name, description, price, currentStock, minStock, uom } = req.body;
  
  try {
    const [result] = await db.promise().query(
      'INSERT INTO items (name, description, price, currentStock, minStock, uom) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, currentStock, minStock, uom]
    );

    const [newItem] = await db.promise().query(
      'SELECT * FROM items WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newItem[0]);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Error creating item' });
  }
};

// Update item
exports.updateItem = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, currentStock, minStock, uom } = req.body;

  try {
    await db.promise().query(
      'UPDATE items SET name = ?, description = ?, price = ?, currentStock = ?, minStock = ?, uom = ? WHERE id = ?',
      [name, description, price, currentStock, minStock, uom, id]
    );

    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Error updating item' });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  const { id } = req.params;

  try {
    await db.promise().query('DELETE FROM items WHERE id = ?', [id]);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Error deleting item' });
  }
};

// Update stock
exports.updateStock = async (req, res) => {
  const { id } = req.params;
  const { quantity, type } = req.body;

  try {
    const [item] = await db.promise().query(
      'SELECT currentStock FROM items WHERE id = ?',
      [id]
    );

    if (item.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const newStock = type === 'decrease' 
      ? item[0].currentStock - quantity 
      : item[0].currentStock + quantity;

    if (newStock < 0) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    await db.promise().query(
      'UPDATE items SET currentStock = ? WHERE id = ?',
      [newStock, id]
    );

    res.json({ 
      message: 'Stock updated successfully',
      currentStock: newStock 
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ message: 'Error updating stock' });
  }
};
