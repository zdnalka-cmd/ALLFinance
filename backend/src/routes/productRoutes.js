const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, productController.getProducts);
router.post('/', authMiddleware, productController.createProduct);
router.put('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);
router.post('/:id/buy', authMiddleware, productController.buyProduct);
router.get('/:id/stats', authMiddleware, productController.getProductStats);
router.patch('/:id/stock', authMiddleware, productController.adjustStock);

module.exports = router;
