const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { authenticate } = require('../middleware/auth');
const { validatePromotion } = require('../middleware/validations');

// Middleware to check if user has admin or accountant role
const checkRole = (req, res, next) => {
    const allowedRoles = ['admin', 'accountant'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            error: 'Access denied. You do not have permission to perform this action.'
        });
    }
    next();
};

// Route to promote a student
router.post(
    '/students/:studentId/promote',
    authenticate,
    checkRole,
    validatePromotion,
    promotionController.promoteStudent
);

// Route to get promotion history for a student
router.get(
    '/students/:studentId/promotion-history',
    authenticate,
    promotionController.getPromotionHistory
);

// Route to get balance transfer details
router.get(
    '/balance-transfers/:transferId',
    authenticate,
    promotionController.getBalanceTransferDetails
);

// Route to get all balance transfers for a student
router.get(
    '/students/:studentId/balance-transfers',
    authenticate,
    async (req, res) => {
        try {
            const transfers = await FeeBalanceTransfer.findAll({
                where: { student_id: req.params.studentId },
                include: [{
                    model: FeeBalanceDetail,
                    as: 'balanceDetails'
                }],
                order: [['transfer_date', 'DESC']]
            });

            res.json({
                data: transfers
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to fetch balance transfers'
            });
        }
    }
);

// Route to get promotion statistics (for admin dashboard)
router.get(
    '/statistics',
    authenticate,
    checkRole,
    async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            
            const query = {
                where: {},
                include: [{
                    model: Student,
                    attributes: ['id', 'first_name', 'last_name', 'current_class']
                }]
            };

            // Add date range filter if provided
            if (startDate && endDate) {
                query.where.promotion_date = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }

            const promotions = await StudentPromotion.findAll(query);

            // Calculate statistics
            const stats = {
                totalPromotions: promotions.length,
                byClass: {},
                totalBalanceTransferred: 0
            };

            promotions.forEach(promotion => {
                // Count promotions by class
                const key = `${promotion.from_class} to ${promotion.to_class}`;
                stats.byClass[key] = (stats.byClass[key] || 0) + 1;
            });

            // Get total balance transferred
            const balanceTransfers = await FeeBalanceTransfer.sum('total_balance_transferred', {
                where: query.where
            });

            stats.totalBalanceTransferred = balanceTransfers || 0;

            res.json({
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to fetch promotion statistics'
            });
        }
    }
);

module.exports = router;
