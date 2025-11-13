const db = require('../db');

exports.getAllItems = async (req, res) => {
  try {
    const [items] = await db.promise().query(
      'SELECT * FROM inventory ORDER BY name'
    );
    res.json(items);
  } catch (error) {
    console.error('Get items error:', error);
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
        'SELECT currentStock FROM inventory WHERE id = ?',
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
        'UPDATE inventory SET currentStock = ? WHERE id = ?',
        [newStock, id]
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

exports.checkStock = async (req, res) => {
  const { items } = req.body;
  
  try {
    const itemIds = items.map(item => item.itemId);
    const [inventory] = await db.promise().query(
      'SELECT id, currentStock FROM inventory WHERE id IN (?)',
      [itemIds]
    );

    const stockCheck = items.every(item => {
      const invItem = inventory.find(i => i.id === item.itemId);
      return invItem && invItem.currentStock >= item.quantity;
    });

    res.json({ available: stockCheck });
  } catch (error) {
    console.error('Check stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
