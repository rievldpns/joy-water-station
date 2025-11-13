const db = require('../db');

// Sample fallback products used when DB is empty or inaccessible
const sampleProducts = [
  { id: 1, name: 'Pure Water 5 Gallon', category: 'Water Products', cost: 20.00, price: 25.00, uom: 'Gallon', currentStock: 50, minStock: 10, maxStock: 100, description: 'Pure drinking water' },
  { id: 2, name: 'Water Dispenser', category: 'Accessories', cost: 150.00, price: 200.00, uom: 'Pieces', currentStock: 5, minStock: 2, maxStock: 30, description: 'Hot and cold water dispenser' },
  { id: 3, name: 'Empty Container', category: 'Containers', cost: 3.00, price: 5.00, uom: 'Pieces', currentStock: 25, minStock: 5, maxStock: 50, description: '5 gallon container' }
];

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM products ORDER BY name');
    if (Array.isArray(rows) && rows.length > 0) {
      return res.json(rows);
    }
    // If table empty, attempt to return sample products (and optionally seed DB)
    try {
      // Try to seed sample products if table empty
      for (const prod of sampleProducts) {
        await db.promise().query(
          'INSERT IGNORE INTO products (id, name, category, cost, price, uom, currentStock, minStock, maxStock, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [prod.id, prod.name, prod.category, prod.cost, prod.price, prod.uom, prod.currentStock, prod.minStock, prod.maxStock, prod.description]
        );
      }
      const [afterSeed] = await db.promise().query('SELECT * FROM products ORDER BY name');
      if (Array.isArray(afterSeed) && afterSeed.length > 0) {
        return res.json(afterSeed);
      }
    } catch (seedErr) {
      // ignore seeding errors, return sampleProducts
      console.warn('Seeding products failed:', seedErr.message);
    }
    return res.json(sampleProducts);
  } catch (error) {
    console.error('Get products error:', error.message);
    // On DB error, return sample products so frontend can work
    return res.json(sampleProducts);
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  const { name, category, cost = 0, price = 0, uom = '', currentStock = 0, minStock = 0, maxStock = 0, description = '' } = req.body;
  try {
    const [result] = await db.promise().query(
      'INSERT INTO products (name, category, cost, price, uom, currentStock, minStock, maxStock, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, category, cost, price, uom, currentStock, minStock, maxStock, description]
    );
    const [newProductRows] = await db.promise().query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    return res.status(201).json(newProductRows[0]);
  } catch (error) {
    console.error('Create product error:', error.message);
    return res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, category, cost = 0, price = 0, uom = '', currentStock = 0, minStock = 0, maxStock = 0, description = '' } = req.body;
  try {
    await db.promise().query(
      'UPDATE products SET name = ?, category = ?, cost = ?, price = ?, uom = ?, currentStock = ?, minStock = ?, maxStock = ?, description = ? WHERE id = ?',
      [name, category, cost, price, uom, currentStock, minStock, maxStock, description, id]
    );
    const [rows] = await db.promise().query('SELECT * FROM products WHERE id = ?', [id]);
    return res.json(rows[0] || {});
  } catch (error) {
    console.error('Update product error:', error.message);
    return res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await db.promise().query('DELETE FROM products WHERE id = ?', [id]);
    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error.message);
    return res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
};

// Update stock
exports.updateStock = async (req, res) => {
  const { id } = req.params;
  const { quantity = 0, type = 'increase', reason = '', userId = null } = req.body;
  try {
    const [rows] = await db.promise().query('SELECT currentStock FROM products WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    let newStock = rows[0].currentStock;
    if (type === 'decrease') newStock -= Math.abs(quantity);
    else newStock += Math.abs(quantity);
    if (newStock < 0) return res.status(400).json({ message: 'Insufficient stock' });
    await db.promise().query('UPDATE products SET currentStock = ? WHERE id = ?', [newStock, id]);

    // Insert into stock_history
    await db.promise().query(
      'INSERT INTO stock_history (itemId, type, quantity, reason, userId) VALUES (?, ?, ?, ?, ?)',
      [id, type === 'decrease' ? 'Stock Out' : 'Stock In', Math.abs(quantity), reason, userId]
    );

    return res.json({ message: 'Stock updated', currentStock: newStock });
  } catch (error) {
    console.error('Update stock error:', error.message);
    return res.status(500).json({ message: 'Failed to update stock', error: error.message });
  }
};

// Bulk update stock (for sales)
exports.bulkUpdateStock = async (req, res) => {
  const updates = req.body; // Array of { id, quantity, type: 'decrease' | 'increase', reason, userId }
  if (!Array.isArray(updates)) {
    return res.status(400).json({ message: 'Updates must be an array' });
  }

  try {
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      const results = [];
      for (const update of updates) {
        const { id, quantity, type = 'decrease', reason = '', userId = null } = update;
        const [rows] = await connection.query('SELECT currentStock FROM products WHERE id = ?', [id]);
        if (!rows || rows.length === 0) {
          throw new Error(`Product ${id} not found`);
        }
        let newStock = rows[0].currentStock;
        if (type === 'decrease') newStock -= Math.abs(quantity);
        else newStock += Math.abs(quantity);
        if (newStock < 0) {
          throw new Error(`Insufficient stock for product ${id}`);
        }
        await connection.query('UPDATE products SET currentStock = ? WHERE id = ?', [newStock, id]);

        // Insert into stock_history
        await connection.query(
          'INSERT INTO stock_history (itemId, type, quantity, reason, userId) VALUES (?, ?, ?, ?, ?)',
          [id, type === 'decrease' ? 'Stock Out' : 'Stock In', Math.abs(quantity), reason, userId]
        );

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

// Get stock history for a product
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
