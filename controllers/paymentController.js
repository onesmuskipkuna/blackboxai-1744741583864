const { 
    Payment, 
    PaymentItem, 
    Invoice, 
    InvoiceItem, 
    Student,
    sequelize 
} = require('../models');
const { ValidationError, BusinessError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

class PaymentController {
    /**
     * Process a new payment
     */
    async processPayment(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const {
                invoice_id,
                amount,
                payment_mode,
                payment_details,
                items
            } = req.body;

            // Validate invoice
            const invoice = await Invoice.findByPk(invoice_id, {
                include: [{
                    model: InvoiceItem,
                    as: 'items'
                }]
            });

            if (!invoice) {
                throw new NotFoundError('Invoice not found');
            }

            if (invoice.status === 'CANCELLED') {
                throw new BusinessError('Cannot process payment for cancelled invoice');
            }

            if (invoice.status === 'PAID') {
                throw new BusinessError('Invoice is already fully paid');
            }

            // Validate payment amount
            const totalPaymentAmount = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
            if (totalPaymentAmount !== parseFloat(amount)) {
                throw new ValidationError('Payment amount mismatch with items total');
            }

            if (totalPaymentAmount > invoice.balance_amount) {
                throw new ValidationError('Payment amount exceeds invoice balance');
            }

            // Create payment record
            const payment = await Payment.create({
                invoice_id,
                student_id: invoice.student_id,
                amount: totalPaymentAmount,
                payment_mode,
                status: 'PENDING',
                collected_by: req.user.id,
                ...payment_details
            }, { transaction });

            // Process payment items
            for (const item of items) {
                const invoiceItem = invoice.items.find(i => i.id === item.invoice_item_id);
                if (!invoiceItem) {
                    throw new ValidationError(`Invalid invoice item: ${item.invoice_item_id}`);
                }

                if (item.amount > invoiceItem.balance_amount) {
                    throw new ValidationError(`Payment amount exceeds balance for item: ${invoiceItem.item_name}`);
                }

                await PaymentItem.create({
                    payment_id: payment.id,
                    invoice_item_id: item.invoice_item_id,
                    amount: item.amount,
                    original_invoice_item_amount: invoiceItem.amount,
                    payment_sequence: item.sequence || 0
                }, { transaction });
            }

            // Update invoice paid and balance amounts
            await invoice.update({
                paid_amount: sequelize.literal(`paid_amount + ${totalPaymentAmount}`),
                balance_amount: sequelize.literal(`balance_amount - ${totalPaymentAmount}`),
                payment_status: 'IN_PROGRESS'
            }, { transaction });

            // If payment mode is CASH, automatically verify the payment
            if (payment_mode === 'CASH') {
                await payment.verify(req.user.id);
            }

            await transaction.commit();

            // Log success
            logger.info('Payment processed', {
                paymentId: payment.id,
                invoiceId: invoice_id,
                amount: totalPaymentAmount,
                mode: payment_mode
            });

            // Fetch complete payment details
            const completePayment = await Payment.findByPk(payment.id, {
                include: [{
                    model: PaymentItem,
                    as: 'items',
                    include: [{
                        model: InvoiceItem,
                        as: 'invoiceItem'
                    }]
                }, {
                    model: Student,
                    as: 'student'
                }]
            });

            res.status(201).json({
                message: 'Payment processed successfully',
                data: completePayment
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Verify payment
     */
    async verifyPayment(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const payment = await Payment.findByPk(id);

            if (!payment) {
                throw new NotFoundError('Payment not found');
            }

            if (payment.status !== 'PENDING') {
                throw new BusinessError('Payment is not in pending status');
            }

            await payment.verify(req.user.id);
            await transaction.commit();

            logger.info('Payment verified', {
                paymentId: id,
                verifiedBy: req.user.id
            });

            res.json({
                message: 'Payment verified successfully'
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Cancel payment
     */
    async cancelPayment(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const { reason } = req.body;

            const payment = await Payment.findByPk(id, {
                include: [{
                    model: PaymentItem,
                    as: 'items'
                }]
            });

            if (!payment) {
                throw new NotFoundError('Payment not found');
            }

            if (payment.status === 'CANCELLED') {
                throw new BusinessError('Payment is already cancelled');
            }

            // Cancel payment and update invoice
            await payment.cancel(req.user.id, reason);

            await transaction.commit();

            logger.info('Payment cancelled', {
                paymentId: id,
                cancelledBy: req.user.id,
                reason
            });

            res.json({
                message: 'Payment cancelled successfully'
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Process payment refund
     */
    async processRefund(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const { amount, reference, reason } = req.body;

            const payment = await Payment.findByPk(id);
            if (!payment) {
                throw new NotFoundError('Payment not found');
            }

            if (payment.status !== 'COMPLETED') {
                throw new BusinessError('Only completed payments can be refunded');
            }

            if (amount > payment.amount) {
                throw new ValidationError('Refund amount cannot exceed payment amount');
            }

            await payment.refund(amount, reference);

            await transaction.commit();

            logger.info('Payment refunded', {
                paymentId: id,
                amount,
                reference,
                reason
            });

            res.json({
                message: 'Payment refunded successfully'
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get payment details
     */
    async getPayment(req, res) {
        const { id } = req.params;

        const payment = await Payment.findByPk(id, {
            include: [{
                model: PaymentItem,
                as: 'items',
                include: [{
                    model: InvoiceItem,
                    as: 'invoiceItem'
                }]
            }, {
                model: Student,
                as: 'student'
            }, {
                model: Invoice,
                as: 'invoice'
            }]
        });

        if (!payment) {
            throw new NotFoundError('Payment not found');
        }

        res.json({ data: payment });
    }

    /**
     * Get student's payment history
     */
    async getStudentPayments(req, res) {
        const { student_id } = req.params;
        const { start_date, end_date, status } = req.query;

        const where = { student_id };
        if (start_date && end_date) {
            where.payment_date = {
                [Op.between]: [new Date(start_date), new Date(end_date)]
            };
        }
        if (status) where.status = status;

        const payments = await Payment.findAll({
            where,
            include: [{
                model: PaymentItem,
                as: 'items'
            }],
            order: [['payment_date', 'DESC']]
        });

        res.json({ data: payments });
    }

    /**
     * Get payment statistics
     */
    async getStatistics(req, res) {
        const { start_date, end_date, payment_mode } = req.query;

        const where = {};
        if (start_date && end_date) {
            where.payment_date = {
                [Op.between]: [new Date(start_date), new Date(end_date)]
            };
        }
        if (payment_mode) where.payment_mode = payment_mode;

        const stats = await Payment.findAll({
            where,
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'total_payments'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
                'payment_mode',
                'status'
            ],
            group: ['payment_mode', 'status']
        });

        res.json({ data: stats });
    }
}

module.exports = new PaymentController();
