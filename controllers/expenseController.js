const { 
    Expense, 
    ExpenseCategory, 
    ExpenseAttachment, 
    Vendor, 
    Budget,
    sequelize 
} = require('../models');
const { ValidationError, BusinessError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

class ExpenseController {
    /**
     * Create a new expense
     */
    async createExpense(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const {
                category_id,
                title,
                description,
                amount,
                tax_amount,
                expense_date,
                payment_mode,
                vendor_id,
                budget_id,
                ...otherDetails
            } = req.body;

            // Validate category
            const category = await ExpenseCategory.findByPk(category_id);
            if (!category) {
                throw new NotFoundError('Expense category not found');
            }

            // Validate vendor if provided
            if (vendor_id) {
                const vendor = await Vendor.findByPk(vendor_id);
                if (!vendor) {
                    throw new NotFoundError('Vendor not found');
                }

                if (vendor.status === 'BLACKLISTED') {
                    throw new BusinessError('Vendor is blacklisted');
                }

                if (vendor.isOverCreditLimit(amount)) {
                    throw new BusinessError('Vendor credit limit exceeded');
                }
            }

            // Check budget if provided
            if (budget_id) {
                const budget = await Budget.findByPk(budget_id);
                if (!budget) {
                    throw new NotFoundError('Budget not found');
                }

                if (budget.status !== 'ACTIVE') {
                    throw new BusinessError('Budget is not active');
                }

                if (budget.isFrozen()) {
                    throw new BusinessError('Budget is frozen');
                }

                // Check category allocation if exists
                if (budget.category_allocations?.[category_id]) {
                    const allocated = parseFloat(budget.category_allocations[category_id]);
                    const utilized = await Expense.sum('total_amount', {
                        where: {
                            category_id,
                            budget_id,
                            status: 'APPROVED'
                        }
                    });

                    if ((utilized + parseFloat(amount)) > allocated) {
                        throw new BusinessError('Category budget allocation exceeded');
                    }
                }
            }

            // Create expense
            const expense = await Expense.create({
                category_id,
                title,
                description,
                amount,
                tax_amount: tax_amount || 0,
                expense_date,
                payment_mode,
                vendor_id,
                budget_id,
                created_by: req.user.id,
                academic_year: req.academic_year,
                ...otherDetails
            }, { transaction });

            // Handle attachments if any
            if (req.files?.length) {
                const attachments = await Promise.all(
                    req.files.map(file =>
                        ExpenseAttachment.create({
                            expense_id: expense.id,
                            file_name: file.filename,
                            original_name: file.originalname,
                            file_path: file.path,
                            file_type: file.mimetype.split('/')[0],
                            file_size: file.size,
                            mime_type: file.mimetype,
                            attachment_type: file.fieldname.toUpperCase(),
                            uploaded_by: req.user.id
                        }, { transaction })
                    )
                );

                expense.attachments = attachments;
            }

            // Update vendor stats if applicable
            if (vendor_id) {
                const vendor = await Vendor.findByPk(vendor_id);
                await vendor.updateTotalExpenses();
            }

            await transaction.commit();

            // Log success
            logger.info('Expense created', {
                expenseId: expense.id,
                amount: expense.total_amount,
                category: category.name
            });

            // Fetch complete expense with associations
            const completeExpense = await Expense.findByPk(expense.id, {
                include: [{
                    model: ExpenseCategory,
                    as: 'category'
                }, {
                    model: Vendor,
                    as: 'vendor'
                }, {
                    model: ExpenseAttachment,
                    as: 'attachments'
                }]
            });

            res.status(201).json({
                message: 'Expense created successfully',
                data: completeExpense
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Update expense
     */
    async updateExpense(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const updates = req.body;

            const expense = await Expense.findByPk(id);
            if (!expense) {
                throw new NotFoundError('Expense not found');
            }

            if (['APPROVED', 'CANCELLED'].includes(expense.status)) {
                throw new BusinessError('Cannot update approved or cancelled expense');
            }

            // Validate category if changed
            if (updates.category_id && updates.category_id !== expense.category_id) {
                const category = await ExpenseCategory.findByPk(updates.category_id);
                if (!category) {
                    throw new NotFoundError('Expense category not found');
                }
            }

            // Update expense
            await expense.update({
                ...updates,
                updated_by: req.user.id
            }, { transaction });

            // Handle attachments if any
            if (req.files?.length) {
                await Promise.all(
                    req.files.map(file =>
                        ExpenseAttachment.create({
                            expense_id: expense.id,
                            file_name: file.filename,
                            original_name: file.originalname,
                            file_path: file.path,
                            file_type: file.mimetype.split('/')[0],
                            file_size: file.size,
                            mime_type: file.mimetype,
                            attachment_type: file.fieldname.toUpperCase(),
                            uploaded_by: req.user.id
                        }, { transaction })
                    )
                );
            }

            await transaction.commit();

            // Log update
            logger.info('Expense updated', {
                expenseId: expense.id,
                updatedBy: req.user.id
            });

            // Fetch updated expense with associations
            const updatedExpense = await Expense.findByPk(id, {
                include: [{
                    model: ExpenseCategory,
                    as: 'category'
                }, {
                    model: Vendor,
                    as: 'vendor'
                }, {
                    model: ExpenseAttachment,
                    as: 'attachments'
                }]
            });

            res.json({
                message: 'Expense updated successfully',
                data: updatedExpense
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get expense details
     */
    async getExpense(req, res) {
        const { id } = req.params;

        const expense = await Expense.findByPk(id, {
            include: [{
                model: ExpenseCategory,
                as: 'category'
            }, {
                model: Vendor,
                as: 'vendor'
            }, {
                model: ExpenseAttachment,
                as: 'attachments'
            }, {
                model: Budget,
                as: 'budget'
            }]
        });

        if (!expense) {
            throw new NotFoundError('Expense not found');
        }

        res.json({ data: expense });
    }

    /**
     * List expenses with filters
     */
    async listExpenses(req, res) {
        const {
            category_id,
            vendor_id,
            status,
            payment_status,
            start_date,
            end_date,
            min_amount,
            max_amount,
            sort_by = 'expense_date',
            sort_order = 'DESC',
            page = 1,
            limit = 10
        } = req.query;

        const where = {};
        if (category_id) where.category_id = category_id;
        if (vendor_id) where.vendor_id = vendor_id;
        if (status) where.status = status;
        if (payment_status) where.payment_status = payment_status;
        
        if (start_date && end_date) {
            where.expense_date = {
                [Op.between]: [new Date(start_date), new Date(end_date)]
            };
        }

        if (min_amount || max_amount) {
            where.total_amount = {};
            if (min_amount) where.total_amount[Op.gte] = min_amount;
            if (max_amount) where.total_amount[Op.lte] = max_amount;
        }

        const expenses = await Expense.findAndCountAll({
            where,
            include: [{
                model: ExpenseCategory,
                as: 'category'
            }, {
                model: Vendor,
                as: 'vendor'
            }],
            order: [[sort_by, sort_order]],
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        res.json({
            data: expenses.rows,
            pagination: {
                total: expenses.count,
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: Math.ceil(expenses.count / limit)
            }
        });
    }

    /**
     * Approve expense
     */
    async approveExpense(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const expense = await Expense.findByPk(id);

            if (!expense) {
                throw new NotFoundError('Expense not found');
            }

            if (expense.status !== 'PENDING_APPROVAL') {
                throw new BusinessError('Expense is not pending approval');
            }

            await expense.update({
                status: 'APPROVED',
                approved_by: req.user.id,
                approval_date: new Date()
            }, { transaction });

            // Update budget utilization if applicable
            if (expense.budget_id) {
                const budget = await Budget.findByPk(expense.budget_id);
                await budget.trackExpense(expense.total_amount);
            }

            await transaction.commit();

            logger.info('Expense approved', {
                expenseId: expense.id,
                approvedBy: req.user.id
            });

            res.json({
                message: 'Expense approved successfully'
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Cancel expense
     */
    async cancelExpense(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const { reason } = req.body;

            const expense = await Expense.findByPk(id);
            if (!expense) {
                throw new NotFoundError('Expense not found');
            }

            if (['CANCELLED', 'APPROVED'].includes(expense.status)) {
                throw new BusinessError('Cannot cancel approved or already cancelled expense');
            }

            await expense.update({
                status: 'CANCELLED',
                cancelled_by: req.user.id,
                cancellation_date: new Date(),
                cancellation_reason: reason
            }, { transaction });

            await transaction.commit();

            logger.info('Expense cancelled', {
                expenseId: expense.id,
                cancelledBy: req.user.id,
                reason
            });

            res.json({
                message: 'Expense cancelled successfully'
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get expense statistics
     */
    async getStatistics(req, res) {
        const { start_date, end_date, category_id } = req.query;

        const where = {};
        if (start_date && end_date) {
            where.expense_date = {
                [Op.between]: [new Date(start_date), new Date(end_date)]
            };
        }
        if (category_id) where.category_id = category_id;

        const stats = await Expense.findAll({
            where,
            attributes: [
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_amount'],
                'status',
                'payment_status',
                'category_id'
            ],
            include: [{
                model: ExpenseCategory,
                as: 'category',
                attributes: ['name']
            }],
            group: ['status', 'payment_status', 'category_id', 'category.id']
        });

        res.json({ data: stats });
    }
}

module.exports = new ExpenseController();
