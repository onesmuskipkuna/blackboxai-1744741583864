const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const budgetController = require('../controllers/budgetController');
const { authenticate } = require('../middleware/auth');
const { validateExpense, validateExpenseUpdate } = require('../middleware/expenseValidations');
const upload = require('../middleware/fileUpload');

// Middleware to check admin/accountant role
const checkRole = (req, res, next) => {
    const allowedRoles = ['admin', 'accountant'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            error: 'Access denied. You do not have permission to perform this action.'
        });
    }
    next();
};

// Expense Routes
router.post(
    '/',
    authenticate,
    checkRole,
    upload.array('attachments'),
    validateExpense,
    expenseController.createExpense
);

router.put(
    '/:id',
    authenticate,
    checkRole,
    upload.array('attachments'),
    validateExpenseUpdate,
    expenseController.updateExpense
);

router.get(
    '/:id',
    authenticate,
    expenseController.getExpense
);

router.get(
    '/',
    authenticate,
    expenseController.listExpenses
);

router.post(
    '/:id/approve',
    authenticate,
    checkRole,
    expenseController.approveExpense
);

router.post(
    '/:id/cancel',
    authenticate,
    checkRole,
    expenseController.cancelExpense
);

router.get(
    '/statistics',
    authenticate,
    checkRole,
    expenseController.getStatistics
);

// Budget Routes
router.post(
    '/budgets',
    authenticate,
    checkRole,
    budgetController.createBudget
);

router.put(
    '/budgets/:id',
    authenticate,
    checkRole,
    budgetController.updateBudget
);

router.get(
    '/budgets/:id',
    authenticate,
    budgetController.getBudget
);

router.get(
    '/budgets',
    authenticate,
    budgetController.listBudgets
);

router.post(
    '/budgets/:id/approve',
    authenticate,
    checkRole,
    budgetController.approveBudget
);

router.post(
    '/budgets/:id/close',
    authenticate,
    checkRole,
    budgetController.closeBudget
);

router.get(
    '/budgets/statistics',
    authenticate,
    checkRole,
    budgetController.getStatistics
);

// Category Routes
router.get(
    '/categories',
    authenticate,
    expenseController.listCategories
);

router.get(
    '/categories/:id',
    authenticate,
    expenseController.getCategory
);

// Vendor Routes
router.get(
    '/vendors',
    authenticate,
    expenseController.listVendors
);

router.get(
    '/vendors/:id',
    authenticate,
    expenseController.getVendor
);

// Attachment Routes
router.get(
    '/attachments/:id',
    authenticate,
    expenseController.getAttachment
);

router.delete(
    '/attachments/:id',
    authenticate,
    checkRole,
    expenseController.deleteAttachment
);

// Export Routes
router.get(
    '/export',
    authenticate,
    checkRole,
    expenseController.exportExpenses
);

router.get(
    '/budgets/export',
    authenticate,
    checkRole,
    budgetController.exportBudgets
);

module.exports = router;
