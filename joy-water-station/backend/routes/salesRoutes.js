const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

// Get all sales
router.get('/', salesController.getAllSales);

// Get sale by ID
router.get('/:id', salesController.getSaleById);

// Create sale
router.post('/', salesController.createSale);

// Update sale
router.put('/:id', salesController.updateSale);

// Delete sale
router.delete('/:id', salesController.deleteSale);

// Get sales by date range
router.get('/date-range', salesController.getSalesByDateRange);

// Get sales summary
router.get('/summary', salesController.getSalesSummary);

module.exports = router;
