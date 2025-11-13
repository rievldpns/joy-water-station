const db = require('../db');

exports.getAllItems = async (req, res) => {
  try {
    const [items] = await db.promise().query(
      'SELECT * FROM items ORDER BY name'
    );
    res.json(items);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createItem = async (req, res) => {
  const { name, description, price, currentStock, minStock, uom } = req.body;
  
  try {
    const [result] = await db.promise().query(
      'INSERT INTO items (name, description, price, currentStock, minStock, uom) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, currentStock, minStock, uom]
    );
    
    res.status(201).json({
      id: result.insertId,
      name,
      description,
      price,
      currentStock,
      minStock,
      uom
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

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
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStock = async (req, res) => {
  const { id } = req.params;
  const { quantity, type } = req.body;
  
  try {
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      const [item] = await connection.query(
        'SELECT currentStock FROM items WHERE id = ?',
        [id]
      );

      if (item.length === 0) {
        throw new Error('Item not found');
      }

      const newStock = type === 'decrease' 
        ? item[0].currentStock - quantity 
        : item[0].currentStock + quantity;

      if (newStock < 0) {
        throw new Error('Insufficient stock');
      }

      await connection.query(
        'UPDATE items SET currentStock = ? WHERE id = ?',
        [newStock, id]
      );

      await connection.commit();
      res.json({ 
        message: 'Stock updated successfully',
        currentStock: newStock
      });
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

exports.checkStock = async (req, res) => {
  const { itemId } = req.params;
  
  try {
    const [item] = await db.promise().query(
      'SELECT currentStock, minStock FROM items WHERE id = ?',
      [itemId]
    );
    
    if (item.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json({
      currentStock: item[0].currentStock,
      minStock: item[0].minStock,
      isLow: item[0].currentStock <= item[0].minStock
    });
  } catch (error) {
    console.error('Check stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
