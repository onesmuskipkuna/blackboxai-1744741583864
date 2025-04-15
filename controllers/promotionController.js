const { Student, StudentPromotion, FeeBalanceTransfer, FeeBalanceDetail, Invoice, InvoiceItem } = require('../models');
const sequelize = require('../config/database');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class PromotionController {
    // Helper function to validate class progression
    validateClassProgression(fromClass, toClass) {
        const primaryClasses = ['pg', 'pp1', 'pp2', 'grade1', 'grade2', 'grade3', 'grade4', 'grade5', 'grade6'];
        const juniorClasses = ['grade7', 'grade8', 'grade9', 'grade10'];
        
        const fromIndex = primaryClasses.indexOf(fromClass.toLowerCase());
        const toIndex = primaryClasses.indexOf(toClass.toLowerCase());
        
        if (fromIndex !== -1) {
            // Current class is primary
            if (toIndex !== -1) {
                // Moving to another primary class
                return toIndex > fromIndex;
            } else {
                // Moving to junior class (only grade6 can move to grade7)
                return fromClass.toLowerCase() === 'grade6' && toClass.toLowerCase() === 'grade7';
            }
        } else {
            // Current class is junior
            const fromJuniorIndex = juniorClasses.indexOf(fromClass.toLowerCase());
            const toJuniorIndex = juniorClasses.indexOf(toClass.toLowerCase());
            return toJuniorIndex > fromJuniorIndex;
        }
    }

    async promoteStudent(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const {
                studentId,
                toClass,
                toAcademicYear,
                remarks
            } = req.body;

            // Get student with current class
            const student = await Student.findByPk(studentId);
            if (!student) {
                throw new ValidationError('Student not found');
            }

            const fromClass = student.current_class;
            const fromAcademicYear = student.academic_year;

            // Validate class progression
            if (!this.validateClassProgression(fromClass, toClass)) {
                throw new ValidationError('Invalid class progression. Students can only be promoted to higher classes.');
            }

            // Get outstanding balances
            const outstandingInvoices = await Invoice.findAll({
                where: {
                    student_id: studentId,
                    status: ['UNPAID', 'PARTIALLY_PAID']
                },
                include: [{ model: InvoiceItem }],
                transaction
            });

            // Calculate total outstanding balance
            let totalBalance = 0;
            const balanceDetails = [];

            for (const invoice of outstandingInvoices) {
                for (const item of invoice.InvoiceItems) {
                    if (item.balance > 0) {
                        totalBalance += parseFloat(item.balance);
                        balanceDetails.push({
                            fee_item_name: item.fee_item_name,
                            original_amount: item.amount,
                            balance_amount: item.balance,
                            term: invoice.term,
                            academic_year: invoice.academic_year
                        });
                    }
                }
            }

            // Create promotion record
            const promotion = await StudentPromotion.create({
                student_id: studentId,
                from_class: fromClass,
                to_class: toClass,
                from_academic_year: fromAcademicYear,
                to_academic_year: toAcademicYear,
                remarks,
                promotion_date: new Date()
            }, { transaction });

            // Update student's class and promotion history
            const promotionHistoryEntry = {
                from_class: fromClass,
                to_class: toClass,
                date: new Date(),
                academic_year: fromAcademicYear,
                promotion_id: promotion.id
            };

            await student.update({
                current_class: toClass,
                academic_year: toAcademicYear,
                promotion_history: sequelize.fn('JSON_ARRAY_APPEND', 
                    sequelize.col('promotion_history'), 
                    '$', 
                    JSON.stringify(promotionHistoryEntry)
                )
            }, { transaction });

            // Handle balance transfer if there are outstanding balances
            let balanceTransfer = null;
            if (totalBalance > 0) {
                balanceTransfer = await FeeBalanceTransfer.create({
                    student_id: studentId,
                    from_class: fromClass,
                    to_class: toClass,
                    from_term: fromAcademicYear,
                    to_term: toAcademicYear,
                    total_balance_transferred: totalBalance,
                    status: 'TRANSFERRED'
                }, { transaction });

                // Create detailed balance records
                await Promise.all(balanceDetails.map(detail => 
                    FeeBalanceDetail.create({
                        balance_transfer_id: balanceTransfer.id,
                        ...detail
                    }, { transaction })
                ));
            }

            await transaction.commit();

            // Log successful promotion
            logger.info(`Student ${studentId} promoted from ${fromClass} to ${toClass}`, {
                studentId,
                fromClass,
                toClass,
                totalBalanceTransferred: totalBalance
            });

            res.status(200).json({
                message: 'Student promoted successfully',
                data: {
                    promotion,
                    balanceTransfer,
                    balanceDetails,
                    newClass: toClass,
                    totalBalanceTransferred: totalBalance
                }
            });

        } catch (error) {
            await transaction.rollback();
            
            // Log error
            logger.error('Student promotion failed', {
                error: error.message,
                studentId: req.body.studentId
            });

            if (error instanceof ValidationError) {
                return res.status(400).json({
                    error: error.message
                });
            }

            res.status(500).json({
                error: 'Failed to promote student. Please try again.'
            });
        }
    }

    async getPromotionHistory(req, res) {
        try {
            const { studentId } = req.params;

            const history = await StudentPromotion.findAll({
                where: { student_id: studentId },
                include: [{
                    model: FeeBalanceTransfer,
                    as: 'balanceTransfer',
                    include: [{
                        model: FeeBalanceDetail,
                        as: 'balanceDetails'
                    }]
                }],
                order: [['promotion_date', 'DESC']]
            });

            res.json({
                data: history
            });

        } catch (error) {
            logger.error('Failed to fetch promotion history', {
                error: error.message,
                studentId: req.params.studentId
            });

            res.status(500).json({
                error: 'Failed to fetch promotion history'
            });
        }
    }

    async getBalanceTransferDetails(req, res) {
        try {
            const { transferId } = req.params;

            const transfer = await FeeBalanceTransfer.findByPk(transferId, {
                include: [{
                    model: FeeBalanceDetail,
                    as: 'balanceDetails'
                }, {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'first_name', 'last_name', 'admission_number']
                }]
            });

            if (!transfer) {
                return res.status(404).json({
                    error: 'Balance transfer record not found'
                });
            }

            res.json({
                data: transfer
            });

        } catch (error) {
            logger.error('Failed to fetch balance transfer details', {
                error: error.message,
                transferId: req.params.transferId
            });

            res.status(500).json({
                error: 'Failed to fetch balance transfer details'
            });
        }
    }
}

module.exports = new PromotionController();
