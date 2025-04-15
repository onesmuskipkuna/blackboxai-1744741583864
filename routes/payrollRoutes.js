const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticate } = require('../middleware/auth');

// Middleware to check admin or HR role
const checkRole = (req, res, next) => {
    const allowedRoles = ['admin', 'hr'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            error: 'Access denied. You do not have permission to perform this action.'
        });
    }
    next();
};

// Payroll Routes
router.post(
    '/',
    authenticate,
    checkRole,
    payrollController.createOrUpdateSalary
);

router.get(
    '/:employee_id/:salary_month',
    authenticate,
    payrollController.getSalary
);

router.get(
    '/',
    authenticate,
    payrollController.listSalaries
);

router.post(
    '/:id/approve',
    authenticate,
    checkRole,
    payrollController.approveSalary
);

router.post(
    '/:id/reject',
    authenticate,
    checkRole,
    payrollController.rejectSalary
);

router.post(
    '/:id/mark-paid',
    authenticate,
    checkRole,
    payrollController.markSalaryPaid
);

router.get(
    '/:id/payslip',
    authenticate,
    payrollController.generatePayslip
);

module.exports = router;
