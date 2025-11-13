const db = require('../db');

const getAllCustomers = async (req, res) => {
  try {
    // Get ALL customers including hidden ones
    const [customers] = await db.query('SELECT * FROM customers ORDER BY createdAt DESC');
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const [customers] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customers[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Failed to fetch customer' });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { name, phone, address, email, customerType } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ message: 'Name, phone, and address are required' });
    }

    const [result] = await db.query(
      'INSERT INTO customers (name, phone, address, email, customerType, hidden, lastOrder, totalOrders) VALUES (?, ?, ?, ?, ?, FALSE, NULL, 0)',
      [name, phone, address, email || '', customerType || 'Regular']
    );

    const [newCustomer] = await db.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
    res.status(201).json(newCustomer[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Failed to create customer' });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, email, customerType } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ message: 'Name, phone, and address are required' });
    }

    await db.query(
      'UPDATE customers SET name = ?, phone = ?, address = ?, email = ?, customerType = ? WHERE id = ?',
      [name, phone, address, email || '', customerType || 'Regular', id]
    );

    const [updatedCustomer] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (updatedCustomer.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(updatedCustomer[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Failed to update customer' });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE customers SET hidden = TRUE WHERE id = ?', [id]);
    res.json({ message: 'Customer archived successfully' });
  } catch (error) {
    console.error('Error archiving customer:', error);
    res.status(500).json({ message: 'Failed to archive customer' });
  }
};

const restoreCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE customers SET hidden = FALSE WHERE id = ?', [id]);
    res.json({ message: 'Customer restored successfully' });
  } catch (error) {
    console.error('Error restoring customer:', error);
    res.status(500).json({ message: 'Failed to restore customer' });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  restoreCustomer
};