const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');

// Middleware to check admin/accountant/manager role
const checkRole = (req, res, next) => {
    const allowedRoles = ['admin', 'accountant', 'manager'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            error: 'Access denied. You do not have permission to access reports.'
        });
    }
    next();
};

// Fee Collection Reports
router.get(
    '/fee-collections',
    authenticate,
    checkRole,
    reportsController.getFeeCollectionReport
);

// Expense Reports
router.get(
    '/expenses',
    authenticate,
    checkRole,
    reportsController.getExpenseReport
);

// Payroll Reports
router.get(
    '/payroll',
    authenticate,
    checkRole,
    reportsController.getPayrollReport
);

// Budget Reports
router.get(
    '/budgets',
    authenticate,
    checkRole,
    reportsController.getBudgetReport
);

// Financial Summary
router.get(
    '/financial-summary',
    authenticate,
    checkRole,
    reportsController.getFinancialSummary
);

// Student Financial Reports
router.get(
    '/student-financials',
    authenticate,
    checkRole,
    reportsController.getStudentFinancialReport
);

module.exports = router;
