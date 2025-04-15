const { 
    Budget, 
    ExpenseCategory, 
    Expense, 
    sequelize 
} = require('../models');
const { ValidationError, BusinessError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

class BudgetController {
    /**
     * Create a new budget
     */
    async createBudget(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const {
                title,
                description,
                academic_year,
                start_date,
                end_date,
                total_amount,
                type,
                category_allocations,
                monthly_allocations,
                warning_threshold,
                freeze_threshold,
                approval_required,
                ...otherDetails
            } = req.body;

            // Validate dates
            if (new Date(end_date) <= new Date(start_date)) {
                throw new ValidationError('End date must be after start date');
            }

            // Check for overlapping budgets of same type
            const existingBudget = await Budget.findOne({
                where: {
                    type,
                    status: 'ACTIVE',
                    [Op.or]: [{
                        start_date: {
                            [Op.between]: [start_date, end_date]
                        }
                    }, {
                        end_date: {
                            [Op.between]: [start_date, end_date]
                        }
                    }]
                }
            });

            if (existingBudget) {
                throw new BusinessError('An active budget already exists for this period');
            }

            // Validate category allocations if provided
            if (category_allocations) {
                const totalAllocated = Object.values(category_allocations)
                    .reduce((sum, amount) => sum + parseFloat(amount), 0);

                if (totalAllocated > total_amount) {
                    throw new ValidationError('Total category allocations exceed budget amount');
                }

                // Verify categories exist
                const categories = await ExpenseCategory.findAll({
                    where: {
                        id: Object.keys(category_allocations)
                    }
                });

                if (categories.length !== Object.keys(category_allocations).length) {
                    throw new ValidationError('Invalid category in allocations');
                }
            }

            // Validate monthly allocations if provided
            if (monthly_allocations) {
                const totalMonthly = Object.values(monthly_allocations)
                    .reduce((sum, amount) => sum + parseFloat(amount), 0);

                if (totalMonthly > total_amount) {
                    throw new ValidationError('Total monthly allocations exceed budget amount');
                }
            }

            // Create budget
            const budget = await Budget.create({
                title,
                description,
                academic_year,
                start_date,
                end_date,
                total_amount,
                type,
                category_allocations,
                monthly_allocations,
                warning_threshold,
                freeze_threshold,
                approval_required,
                created_by: req.user.id,
                ...otherDetails
            }, { transaction });

            await transaction.commit();

            logger.info('Budget created', {
                budgetId: budget.id,
                amount: budget.total_amount,
                type: budget.type
            });

            res.status(201).json({
                message: 'Budget created successfully',
                data: budget
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Update budget
     */
    async updateBudget(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const updates = req.body;

            const budget = await Budget.findByPk(id);
            if (!budget) {
                throw new NotFoundError('Budget not found');
            }

            if (budget.status !== 'DRAFT') {
                throw new BusinessError('Only draft budgets can be updated');
            }

            // Validate category allocations if provided
            if (updates.category_allocations) {
                const totalAllocated = Object.values(updates.category_allocations)
                    .reduce((sum, amount) => sum + parseFloat(amount), 0);

                if (totalAllocated > (updates.total_amount || budget.total_amount)) {
                    throw new ValidationError('Total category allocations exceed budget amount');
                }
            }

            await budget.update({
                ...updates,
                updated_by: req.user.id
            }, { transaction });

            await transaction.commit();

            logger.info('Budget updated', {
                budgetId: budget.id,
                updatedBy: req.user.id
            });

            res.json({
                message: 'Budget updated successfully',
                data: budget
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get budget details
     */
    async getBudget(req, res) {
        const { id } = req.params;

        const budget = await Budget.findByPk(id, {
            include: [{
                model: Expense,
                as: 'expenses',
                where: { status: 'APPROVED' },
                required: false
            }]
        });

        if (!budget) {
            throw new NotFoundError('Budget not found');
        }

        res.json({ data: budget });
    }

    /**
     * List budgets
     */
    async listBudgets(req, res) {
        const {
            academic_year,
            type,
            status,
            page = 1,
            limit = 10
        } = req.query;

        const where = {};
        if (academic_year) where.academic_year = academic_year;
        if (type) where.type = type;
        if (status) where.status = status;

        const budgets = await Budget.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        res.json({
            data: budgets.rows,
            pagination: {
                total: budgets.count,
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: Math.ceil(budgets.count / limit)
            }
        });
    }

    /**
     * Approve budget
     */
    async approveBudget(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const budget = await Budget.findByPk(id);

            if (!budget) {
                throw new NotFoundError('Budget not found');
            }

            if (budget.status !== 'DRAFT') {
                throw new BusinessError('Only draft budgets can be approved');
            }

            await budget.approve(req.user.id);
            await transaction.commit();

            logger.info('Budget approved', {
                budgetId: budget.id,
                approvedBy: req.user.id
            });

            res.json({
                message: 'Budget approved successfully'
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Close budget
     */
    async closeBudget(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const { notes } = req.body;

            const budget = await Budget.findByPk(id);
            if (!budget) {
                throw new NotFoundError('Budget not found');
            }

            await budget.close(req.user.id, notes);
            await transaction.commit();

            logger.info('Budget closed', {
                budgetId: budget.id,
                closedBy: req.user.id
            });

            res.json({
                message: 'Budget closed successfully'
            });

        } catch (error) {
            await transaction.rollLet's create the routes for expense management.

<create_file>
<path>routes/expenseRoutes.js</path>
<content>
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');
const { validateExpense, validateExpenseUpdate, validateExpenseCancellation } = require('../middleware/expenseValidations');

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
    validateExpense,
    expenseController.createExpense
);

router.put(
    '/:id',
    authenticate,
    checkRole,
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
    validateExpenseCancellation,
    expenseController.cancelExpense
);

router.get(
    '/statistics',
    authenticate,
    checkRole,
    expenseController.getStatistics
);

module.exports = router;
