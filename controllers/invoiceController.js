const { 
    Invoice, 
    InvoiceItem, 
    Student, 
    FeeStructure, 
    FeeStructureItem,
    Payment,
    sequelize 
} = require('../models');
const { ValidationError, BusinessError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

class InvoiceController {
    /**
     * Generate a new invoice for a student
     */
    async generateInvoice(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const {
                student_id,
                fee_structure_id,
                academic_year,
                term,
                due_date,
                remarks
            } = req.body;

            // Validate student
            const student = await Student.findByPk(student_id);
            if (!student) {
                throw new NotFoundError('Student not found');
            }

            // Validate fee structure
            const feeStructure = await FeeStructure.findByPk(fee_structure_id, {
                include: [{
                    model: FeeStructureItem,
                    as: 'items',
                    where: { status: 'ACTIVE' }
                }]
            });

            if (!feeStructure) {
                throw new NotFoundError('Fee structure not found');
            }

            // Check for existing invoice
            const existingInvoice = await Invoice.findOne({
                where: {
                    student_id,
                    academic_year,
                    term,
                    status: {
                        [Op.notIn]: ['CANCELLED']
                    }
                }
            });

            if (existingInvoice) {
                throw new BusinessError('Invoice already exists for this term');
            }

            // Calculate total amount
            const totalAmount = feeStructure.items.reduce(
                (sum, item) => sum + parseFloat(item.amount),
                0
            );

            // Create invoice
            const invoice = await Invoice.create({
                student_id,
                fee_structure_id,
                academic_year,
                term,
                class: student.current_class,
                total_amount: totalAmount,
                balance_amount: totalAmount,
                due_date: due_date || new Date(),
                remarks,
                generated_by: req.user.id
            }, { transaction });

            // Create invoice items
            await Promise.all(
                feeStructure.items.map(item =>
                    InvoiceItem.create({
                        invoice_id: invoice.id,
                        fee_structure_item_id: item.id,
                        item_name: item.item_name,
                        description: item.description,
                        category: item.category,
                        amount: item.amount,
                        balance_amount: item.amount,
                        due_date: due_date || new Date(),
                        is_mandatory: item.is_mandatory,
                        display_order: item.display_order
                    }, { transaction })
                )
            );

            await transaction.commit();

            // Log success
            logger.info('Invoice generated', {
                invoiceId: invoice.id,
                studentId: student_id,
                amount: totalAmount
            });

            // Fetch complete invoice with items
            const completeInvoice = await Invoice.findByPk(invoice.id, {
                include: [{
                    model: InvoiceItem,
                    as: 'items'
                }, {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'first_name', 'last_name', 'admission_number']
                }]
            });

            res.status(201).json({
                message: 'Invoice generated successfully',
                data: completeInvoice
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get invoice details
     */
    async getInvoice(req, res) {
        const { id } = req.params;

        const invoice = await Invoice.findByPk(id, {
            include: [{
                model: InvoiceItem,
                as: 'items',
                include: [{
                    model: PaymentItem,
                    as: 'paymentItems',
                    include: [{
                        model: Payment,
                        as: 'payment'
                    }]
                }]
            }, {
                model: Student,
                as: 'student',
                attributes: ['id', 'first_name', 'last_name', 'admission_number']
            }, {
                model: FeeStructure,
                as: 'feeStructure'
            }]
        });

        if (!invoice) {
            throw new NotFoundError('Invoice not found');
        }

        res.json({ data: invoice });
    }

    /**
     * Get student's invoices
     */
    async getStudentInvoices(req, res) {
        const { student_id } = req.params;
        const { academic_year, term, status } = req.query;

        const where = { student_id };
        if (academic_year) where.academic_year = academic_year;
        if (term) where.term = term;
        if (status) where.status = status;

        const invoices = await Invoice.findAll({
            where,
            include: [{
                model: InvoiceItem,
                as: 'items'
            }],
            order: [
                ['created_at', 'DESC']
            ]
        });

        res.json({ data: invoices });
    }

    /**
     * Cancel invoice
     */
    async cancelInvoice(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const { reason } = req.body;

            const invoice = await Invoice.findByPk(id);
            if (!invoice) {
                throw new NotFoundError('Invoice not found');
            }

            if (invoice.status === 'CANCELLED') {
                throw new BusinessError('Invoice is already cancelled');
            }

            if (invoice.paid_amount > 0) {
                throw new BusinessError('Cannot cancel invoice with payments');
            }

            await invoice.update({
                status: 'CANCELLED',
                cancelled_by: req.user.id,
                cancellation_date: new Date(),
                cancellation_reason: reason
            }, { transaction });

            await transaction.commit();

            logger.info('Invoice cancelled', {
                invoiceId: id,
                cancelledBy: req.user.id,
                reason
            });

            res.json({
                message: 'Invoice cancelled successfully'
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get outstanding invoices
     */
    async getOutstandingInvoices(req, res) {
        const { student_id, academic_year } = req.query;

        const where = {
            status: {
                [Op.in]: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE']
            }
        };

        if (student_id) where.student_id = student_id;
        if (academic_year) where.academic_year = academic_year;

        const invoices = await Invoice.findAll({
            where,
            include: [{
                model: InvoiceItem,
                as: 'items'
            }, {
                model: Student,
                as: 'student',
                attributes: ['id', 'first_name', 'last_name', 'admission_number']
            }],
            order: [
                ['due_date', 'ASC']
            ]
        });

        res.json({ data: invoices });
    }

    /**
     * Update invoice due date
     */
    async updateDueDate(req, res) {
        const { id } = req.params;
        const { due_date } = req.body;

        const invoice = await Invoice.findByPk(id);
        if (!invoice) {
            throw new NotFoundError('Invoice not found');
        }

        await invoice.update({
            due_date
        });

        // Update due date for all unpaid items
        await InvoiceItem.update({
            due_date
        }, {
            where: {
                invoice_id: id,
                payment_status: 'UNPAID'
            }
        });

        res.json({
            message: 'Due date updated successfully'
        });
    }

    /**
     * Get invoice statistics
     */
    async getStatistics(req, res) {
        const { start_date, end_date, academic_year } = req.query;

        const where = {};
        if (start_date && end_date) {
            where.created_at = {
                [Op.between]: [new Date(start_date), new Date(end_date)]
            };
        }
        if (academic_year) where.academic_year = academic_year;

        const stats = await Invoice.findAll({
            where,
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'total_invoices'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_amount'],
                [sequelize.fn('SUM', sequelize.col('paid_amount')), 'total_paid'],
                [sequelize.fn('SUM', sequelize.col('balance_amount')), 'total_balance'],
                'status'
            ],
            group: ['status']
        });

        res.json({ data: stats });
    }
}

module.exports = new InvoiceController();
