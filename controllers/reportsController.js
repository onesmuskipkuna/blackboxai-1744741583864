const { 
    Employee, 
    Salary, 
    Invoice, 
    Payment, 
    Expense, 
    Budget,
    Department,
    ExpenseCategory,
    sequelize 
} = require('../models');
const { ValidationError, BusinessError } = require('../utils/errors');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

class ReportsController {
    /**
     * Generate fee collection report
     */
    async getFeeCollectionReport(req, res) {
        const { start_date, end_date, format = 'json' } = req.query;

        const where = {};
        if (start_date && end_date) {
            where.payment_date = {
                [Op.between]: [new Date(start_date), new Date(end_date)]
            };
        }

        const collections = await Payment.findAll({
            where,
            include: [{
                model: Invoice,
                as: 'invoice'
            }],
            attributes: [
                [sequelize.fn('DATE', sequelize.col('payment_date')), 'date'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'transaction_count'],
                'payment_mode'
            ],
            group: [
                sequelize.fn('DATE', sequelize.col('payment_date')),
                'payment_mode'
            ],
            order: [[sequelize.fn('DATE', sequelize.col('payment_date')), 'DESC']]
        });

        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Fee Collections');

            worksheet.columns = [
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Payment Mode', key: 'payment_mode', width: 15 },
                { header: 'Total Amount', key: 'total_amount', width: 15 },
                { header: 'Transactions', key: 'transaction_count', width: 15 }
            ];

            collections.forEach(collection => {
                worksheet.addRow({
                    date: collection.date,
                    payment_mode: collection.payment_mode,
                    total_amount: collection.total_amount,
                    transaction_count: collection.transaction_count
                });
            });

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=fee-collections.xlsx'
            );

            return workbook.xlsx.write(res).then(() => res.end());
        }

        res.json({ data: collections });
    }

    /**
     * Generate expense report
     */
    async getExpenseReport(req, res) {
        const { start_date, end_date, category_id, format = 'json' } = req.query;

        const where = {};
        if (start_date && end_date) {
            where.expense_date = {
                [Op.between]: [new Date(start_date), new Date(end_date)]
            };
        }
        if (category_id) where.category_id = category_id;

        const expenses = await Expense.findAll({
            where,
            include: [{
                model: ExpenseCategory,
                as: 'category'
            }],
            attributes: [
                'category_id',
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_amount'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['category_id', 'category.id', 'category.name'],
            order: [[sequelize.fn('SUM', sequelize.col('total_amount')), 'DESC']]
        });

        if (format === 'pdf') {
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=expense-report.pdf');
            doc.pipe(res);

            doc.fontSize(16).text('Expense Report', { align: 'center' });
            doc.moveDown();

            expenses.forEach(expense => {
                doc.fontSize(12).text(`Category: ${expense.category.name}`);
                doc.fontSize(10).text(`Total Amount: ${expense.total_amount}`);
                doc.fontSize(10).text(`Number of Expenses: ${expense.count}`);
                doc.moveDown();
            });

            doc.end();
            return;
        }

        res.json({ data: expenses });
    }

    /**
     * Generate payroll report
     */
    async getPayrollReport(req, res) {
        const { month, department_id, format = 'json' } = req.query;

        const where = {};
        if (month) where.salary_month = month;
        if (department_id) where['$employee.department_id$'] = department_id;

        const payroll = await Salary.findAll({
            where,
            include: [{
                model: Employee,
                as: 'employee',
                include: [{
                    model: Department,
                    as: 'department'
                }]
            }],
            attributes: [
                [sequelize.fn('SUM', sequelize.col('basic_salary')), 'total_basic'],
                [sequelize.fn('SUM', sequelize.col('gross_salary')), 'total_gross'],
                [sequelize.fn('SUM', sequelize.col('net_salary')), 'total_net'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'employee_count']
            ],
            group: ['employee.department_id', 'employee.department.id', 'employee.department.name']
        });

        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Payroll Summary');

            worksheet.columns = [
                { header: 'Department', key: 'department', width: 20 },
                { header: 'Employee Count', key: 'employee_count', width: 15 },
                { header: 'Total Basic', key: 'total_basic', width: 15 },
                { header: 'Total Gross', key: 'total_gross', width: 15 },
                { header: 'Total Net', key: 'total_net', width: 15 }
            ];

            payroll.forEach(record => {
                worksheet.addRow({
                    department: record.employee.department.name,
                    employee_count: record.employee_count,
                    total_basic: record.total_basic,
                    total_gross: record.total_gross,
                    total_net: record.total_net
                });
            });

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=payroll-report.xlsx'
            );

            return workbook.xlsx.write(res).then(() => res.end());
        }

        res.json({ data: payroll });
    }

    /**
     * Generate budget utilization report
     */
    async getBudgetReport(req, res) {
        const { academic_year, format = 'json' } = req.query;

        const where = {};
        if (academic_year) where.academic_year = academic_year;

        const budgets = await Budget.findAll({
            where,
            attributes: [
                'type',
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_allocated'],
                [sequelize.fn('SUM', sequelize.col('utilized_amount')), 'total_utilized'],
                [
                    sequelize.literal('(SUM(utilized_amount) / SUM(total_amount)) * 100'),
                    'utilization_percentage'
                ]
            ],
            group: ['type']
        });

        if (format === 'pdf') {
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=budget-report.pdf');
            doc.pipe(res);

            doc.fontSize(16).text('Budget Utilization Report', { align: 'center' });
            doc.moveDown();

            budgets.forEach(budget => {
                doc.fontSize(12).text(`Budget Type: ${budget.type}`);
                doc.fontSize(10).text(`Total Allocated: ${budget.total_allocated}`);
                doc.fontSize(10).text(`Total Utilized: ${budget.total_utilized}`);
                doc.fontSize(10).text(`Utilization: ${budget.utilization_percentage}%`);
                doc.moveDown();
            });

            doc.end();
            return;
        }

        res.json({ data: budgets });
    }

    /**
     * Generate financial summary report
     */
    async getFinancialSummary(req, res) {
        const { start_date, end_date } = req.query;

        const where = {};
        if (start_date && end_date) {
            where.created_at = {
                [Op.between]: [new Date(start_date), new Date(end_date)]
            };
        }

        // Get total fee collections
        const feeCollections = await Payment.sum('amount', { where });

        // Get total expenses
        const expenses = await Expense.sum('total_amount', { 
            where: {
                ...where,
                status: 'APPROVED'
            }
        });

        // Get total salary payments
        const salaries = await Salary.sum('net_salary', {
            where: {
                ...where,
                status: 'PAID'
            }
        });

        // Get category-wise expenses
        const categoryExpenses = await Expense.findAll({
            where: {
                ...where,
                status: 'APPROVED'
            },
            include: [{
                model: ExpenseCategory,
                as: 'category'
            }],
            attributes: [
                'category_id',
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_amount']
            ],
            group: ['category_id', 'category.id', 'category.name']
        });

        // Calculate summary
        const summary = {
            total_income: feeCollections || 0,
            total_expenses: (expenses || 0) + (salaries || 0),
            net_balance: (feeCollections || 0) - ((expenses || 0) + (salaries || 0)),
            expense_breakdown: {
                operational: expenses || 0,
                payroll: salaries || 0
            },
            category_expenses: categoryExpenses
        };

        res.json({ data: summary });
    }

    /**
     * Generate student financial report
     */
    async getStudentFinancialReport(req, res) {
        const { student_id, academic_year } = req.query;

        const invoices = await Invoice.findAll({
            where: {
                student_id,
                academic_year
            },
            include: [{
                model: Payment,
                as: 'payments'
            }]
        });

        const summary = {
            total_fees: invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0),
            total_paid: invoices.reduce((sum, inv) => 
                sum + inv.payments.reduce((psum, p) => psum + parseFloat(p.amount), 0), 0),
            pending_amount: invoices.reduce((sum, inv) => sum + parseFloat(inv.balance_amount), 0),
            payment_history: invoices.map(inv => ({
                invoice_number: inv.invoice_number,
                total_amount: inv.total_amount,
                paid_amount: inv.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
                balance: inv.balance_amount,
                due_date: inv.due_date,
                status: inv.status
            }))
        };

        res.json({ data: summary });
    }
}

module.exports = new ReportsController();
