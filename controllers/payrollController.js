const { Employee, Salary, sequelize } = require('../models');
const { ValidationError, BusinessError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class PayrollController {
    /**
     * Create or update salary record for an employee for a given month
     */
    async createOrUpdateSalary(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const {
                employee_id,
                salary_month,
                basic_salary,
                allowances,
                deductions,
                overtime_hours,
                overtime_rate,
                bonus,
                reimbursements,
                payment_mode,
                bank_name,
                bank_account_number,
                payment_reference
            } = req.body;

            // Validate employee
            const employee = await Employee.findByPk(employee_id);
            if (!employee) {
                throw new NotFoundError('Employee not found');
            }

            // Check if salary record exists for the month
            let salary = await Salary.findOne({
                where: {
                    employee_id,
                    salary_month
                }
            });

            if (salary) {
                // Update existing salary
                await salary.update({
                    basic_salary,
                    allowances,
                    deductions,
                    overtime_hours,
                    overtime_rate,
                    bonus,
                    reimbursements,
                    payment_mode,
                    bank_name,
                    bank_account_number,
                    payment_reference,
                    updated_by: req.user.id
                }, { transaction });
            } else {
                // Create new salary record
                salary = await Salary.create({
                    employee_id,
                    salary_month,
                    basic_salary,
                    allowances,
                    deductions,
                    overtime_hours,
                    overtime_rate,
                    bonus,
                    reimbursements,
                    payment_mode,
                    bank_name,
                    bank_account_number,
                    payment_reference,
                    created_by: req.user.id
                }, { transaction });
            }

            await transaction.commit();

            logger.info('Salary record created/updated', {
                salaryId: salary.id,
                employeeId: employee_id,
                salaryMonth: salary_month
            });

            res.status(201).json({
                message: 'Salary record saved successfully',
                data: salary
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get salary details for an employee for a given month
     */
    async getSalary(req, res) {
        const { employee_id, salary_month } = req.params;

        const salary = await Salary.findOne({
            where: {
                employee_id,
                salary_month
            },
            include: [{
                model: Employee,
                as: 'employee'
            }]
        });

        if (!salary) {
            throw new NotFoundError('Salary record not found');
        }

        res.json({ data: salary });
    }

    /**
     * List salaries with filters
     */
    async listSalaries(req, res) {
        const {
            employee_id,
            salary_month,
            status,
            page = 1,
            limit = 10
        } = req.query;

        const where = {};
        if (employee_id) where.employee_id = employee_id;
        if (salary_month) where.salary_month = salary_month;
        if (status) where.status = status;

        const salaries = await Salary.findAndCountAll({
            where,
            include: [{
                model: Employee,
                as: 'employee'
            }],
            order: [['salary_month', 'DESC']],
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        res.json({
            data: salaries.rows,
            pagination: {
                total: salaries.count,
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: Math.ceil(salaries.count / limit)
            }
        });
    }

    /**
     * Approve salary payment
     */
    async approveSalary(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { id } = req.params;
            const salary = await Salary.findByPk(id);

            if (!salary) {
                throw new NotFoundError('Salary record not found');
            }

            if (salary.status !== 'PENDING_APPROVAL') {
                throw new BusinessError('Salary is not pending approval');
            }

            await salary.approve(req.user.id);

            await transaction.commit();

            logger.info('Salary approved', {
                salaryId: id,
                approvedBy: req.user.id
            });

            res.json({ message: 'Salary approved successfully' });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Reject salary payment
     */
    async rejectSalary(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const salary = await Salary.findByPk(id);

            if (!salary) {
                throw new NotFoundError('Salary record not found');
            }

            if (salary.status !== 'PENDING_APPROVAL') {
                throw new BusinessError('Salary is not pending approval');
            }

            await salary.reject(req.user.id, reason);

            await transaction.commit();

            logger.info('Salary rejected', {
                salaryId: id,
                rejectedBy: req.user.id,
                reason
            });

            res.json({ message: 'Salary rejected successfully' });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Mark salary as paid
     */
    async markSalaryPaid(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { id } = req.params;
            const paymentDetails = req.body;

            const salary = await Salary.findByPk(id);

            if (!salary) {
                throw new NotFoundError('Salary record not found');
            }

            if (salary.status !== 'APPROVED') {
                throw new BusinessError('Salary is not approved');
            }

            await salary.markAsPaid(req.user.id, paymentDetails);

            await transaction.commit();

            logger.info('Salary marked as paid', {
                salaryId: id,
                paidBy: req.user.id
            });

            res.json({ message: 'Salary marked as paid successfully' });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Generate payslip for salary
     */
    async generatePayslip(req, res) {
        const { id } = req.params;

        const salary = await Salary.findByPk(id, {
            include: [{
                model: Employee,
                as: 'employee'
            }]
        });

        if (!salary) {
            throw new NotFoundError('Salary record not found');
        }

        const payslip = salary.generatePayslip();

        res.json({ data: payslip });
    }
}

module.exports = new PayrollController();
