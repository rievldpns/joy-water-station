const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// Public: get all items
router.get('/', itemController.getAllItems);

// Create item
router.post('/', itemController.createItem);

// Update item
router.put('/:id', itemController.updateItem);

// Delete item
router.delete('/:id', itemController.deleteItem);

// Update stock
router.put('/:id/stock', itemController.updateStock);

// Bulk update stock
router.put('/bulk/stock', itemController.bulkUpdateStock);

// export
module.exports = router;
