const db = require('../db');

exports.addItem = async (req, res) => {
  const { name, description, price, currentStock, minStock, uom } = req.body;
  
  try {
    const [result] = await db.promise().query(
      'INSERT INTO inventory (name, description, price, currentStock, minStock, uom) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, currentStock, minStock, uom]
    );
    
    res.status(201).json({ 
      message: 'Item added successfully',
      itemId: result.insertId 
    });
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStock = async (req, res) => {
  const { itemId } = req.params;
  const { adjustment, type } = req.body;
  
  try {
    await db.promise().query(
      'UPDATE inventory SET currentStock = currentStock + ? WHERE id = ?',
      [type === 'decrease' ? -adjustment : adjustment, itemId]
    );
    
    res.json({ message: 'Stock updated successfully' });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const [items] = await db.promise().query(
      'SELECT * FROM inventory WHERE currentStock <= minStock'
    );
    res.json(items);
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
