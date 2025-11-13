const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');

// Authentication disabled for customer routes
router.use(authenticate);

// Get all customers
router.get('/', customerController.getAllCustomers);

// Get customer by ID
router.get('/:id', customerController.getCustomerById);

// Create new customer
router.post('/', customerController.createCustomer);

// Update customer
router.put('/:id', customerController.updateCustomer);

// Archive customer (soft delete)
router.delete('/:id', customerController.deleteCustomer);

// Restore customer
router.patch('/:id/restore', customerController.restoreCustomer);

module.exports = router;