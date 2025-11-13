const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');

// Get all items
router.get('/', itemsController.getAllItems);

// Get item by ID
router.get('/:id', itemsController.getItemById);

// Update item
router.put('/:id', itemsController.updateItem);

// Delete item
router.delete('/:id', itemsController.deleteItem);

// Add stock entry (for stock in/out with history tracking)
router.post('/:id/stock-entry', itemsController.addStockEntry);

// Get stock history for an item
router.get('/:id/history', itemsController.getStockHistory);

// Update stock (simpler version without history)
router.put('/:id/stock', itemsController.updateStock);

// Check if items have sufficient stock
router.post('/check-stock', itemsController.checkStock);

module.exports = router;