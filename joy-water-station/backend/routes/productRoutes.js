const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Get all products
router.get('/', productController.getAllProducts);

// Get product by ID
router.get('/:id', productController.getProductById);

// Create product
router.post('/', productController.createProduct);

// Update product
router.put('/:id', productController.updateProduct);

// Delete product
router.delete('/:id', productController.deleteProduct);

// Update stock for single product
router.put('/:id/stock', productController.updateStock);

// **ADD THIS LINE - Bulk update stock for multiple products**
router.put('/bulk/stock', productController.bulkUpdateStock);

// Get stock history
router.get('/:id/history', productController.getStockHistory);

module.exports = router;