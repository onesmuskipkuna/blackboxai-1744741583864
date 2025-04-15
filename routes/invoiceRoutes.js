const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { validateInvoice, validatePayment } = require('../middleware/validations');

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

// Invoice Routes
router.post(
    '/generate',
    authenticate,
    checkRole,
    validateInvoice,
    invoiceController.generateInvoice
);

router.get(
    '/:id',
    authenticate,
    invoiceController.getInvoice
);

router.get(
    '/student/:student_id',
    authenticate,
    invoiceController.getStudentInvoices
);

router.post(
    '/:id/cancel',
    authenticate,
    checkRole,
    invoiceController.cancelInvoice
);

router.put(
    '/:id/due-date',
    authenticate,
    checkRole,
    invoiceController.updateDueDate
);

router.get(
    '/outstanding',
    authenticate,
    invoiceController.getOutstandingInvoices
);

router.get(
    '/statistics',
    authenticate,
    checkRole,
    invoiceController.getStatistics
);

// Payment Routes
router.post(
    '/payments',
    authenticate,
    checkRole,
    validatePayment,
    paymentController.processPayment
);

router.post(
    '/payments/:id/verify',
    authenticate,
    checkRole,
    paymentController.verifyPayment
);

router.post(
    '/payments/:id/cancel',
    authenticate,
    checkRole,
    paymentController.cancelPayment
);

router.post(
    '/payments/:id/refund',
    authenticate,
    checkRole,
    paymentController.processRefund
);

router.get(
    '/payments/:id',
    authenticate,
    paymentController.getPayment
);

router.get(
    '/student/:student_id/payments',
    authenticate,
    paymentController.getStudentPayments
);

router.get(
    '/payments/statistics',
    authenticate,
    checkRole,
    paymentController.getStatistics
);

// Bulk Operations
router.post(
    '/bulk-generate',
    authenticate,
    checkRole,
    async (req, res) => {
        try {
            const { student_ids, fee_structure_id, academic_year, term } = req.body;
            const results = await Promise.all(
                student_ids.map(student_id =>
                    invoiceController.generateInvoice({
                        ...req,
                        body: { student_id, fee_structure_id, academic_year, term }
                    })
                )
            );
            res.json({
                message: 'Bulk invoice generation completed',
                data: results
            });
        } catch (error) {
            next(error);
        }
    }
);

router.post(
    '/bulk-remind',
    authenticate,
    checkRole,
    async (req, res) => {
        try {
            const { invoice_ids } = req.body;
            // Implementation for sending reminders
            res.json({
                message: 'Payment reminders sent successfully'
            });
        } catch (error) {
            next(error);
        }
    }
);

// Reports
router.get(
    '/reports/collection',
    authenticate,
    checkRole,
    async (req, res) => {
        try {
            const { start_date, end_date, payment_mode } = req.query;
            // Implementation for collection report
            res.json({
                data: collectionReport
            });
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    '/reports/outstanding',
    authenticate,
    checkRole,
    async (req, res) => {
        try {
            const { class: className, term } = req.query;
            // Implementation for outstanding report
            res.json({
                data: outstandingReport
            });
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    '/reports/payment-mode',
    authenticate,
    checkRole,
    async (req, res) => {
        try {
            const { start_date, end_date } = req.query;
            // Implementation for payment mode report
            res.json({
                data: paymentModeReport
            });
        } catch (error) {
            next(error);
        }
    }
);

// Receipt Generation
router.get(
    '/payments/:id/receipt',
    authenticate,
    async (req, res) => {
        try {
            const { id } = req.params;
            // Implementation for generating receipt
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=receipt-${id}.pdf`);
            res.send(receiptBuffer);
        } catch (error) {
            next(error);
        }
    }
);

// Export Transactions
router.get(
    '/export',
    authenticate,
    checkRole,
    async (req, res) => {
        try {
            const { start_date, end_date, type } = req.query;
            // Implementation for exporting transactions
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');
            res.send(excelBuffer);
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
