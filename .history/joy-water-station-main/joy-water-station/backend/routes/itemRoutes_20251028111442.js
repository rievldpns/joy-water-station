const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// Item routes
router.get('/', itemController.getAllItems);
router.post('/', itemController.createItem);
router.put('/:id', itemController.updateItem);
router.delete('/:id', itemController.deleteItem);
router.put('/:id/stock', itemController.updateStock);

module.exports = router;
