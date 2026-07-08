const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Protect all finance routes
router.use(authMiddleware);

router.get('/categories', financeController.getCategories);

router.route('/incomes')
  .get(financeController.getIncomes)
  .post(financeController.addIncome);

router.delete('/incomes/:id', financeController.deleteIncome);

router.route('/expenses')
  .get(financeController.getExpenses)
  .post(upload.single('receipt'), financeController.addExpense);

router.delete('/expenses/:id', financeController.deleteExpense);

router.get('/dashboard', financeController.getDashboardStats);
router.get('/journals', financeController.getJournals);

router.route('/customers')
  .get(financeController.getCustomers)
  .post(financeController.addCustomer);

router.route('/customers/:id')
  .put(financeController.updateCustomer)
  .delete(financeController.deleteCustomer);

router.get('/suppliers', financeController.getSuppliers);

module.exports = router;
