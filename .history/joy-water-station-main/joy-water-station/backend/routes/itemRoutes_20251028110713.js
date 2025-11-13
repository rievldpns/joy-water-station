const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, itemController.getAllItems);
router.post('/', authenticate, itemController.createItem);
router.put('/:id', authenticate, itemController.updateItem);
router.put('/:id/stock', authenticate, itemController.updateStock);
router.get('/:id/stock', authenticate, itemController.checkStock);

module.exports = router;
