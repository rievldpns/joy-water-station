const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Public: get all products
router.get('/', productController.getAllProducts);

// Get product by ID
router.get('/:id', productController.getProductById);

// Create product
router.post('/', productController.createProduct);

// Update product
router.put('/:id', productController.updateProduct);

// Delete product
router.delete('/:id', productController.deleteProduct);

// Update stock
router.put('/:id/stock', productController.updateStock);

// Bulk update stock
router.put('/bulk/stock', productController.bulkUpdateStock);

// Get stock history
router.get('/:id/stock-history', productController.getStockHistory);

// export
module.exports = router;
