const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

// Helper function to validate academic year format (YYYY-YYYY)
const academicYearPattern = /^\d{4}-\d{4}$/;
const validateAcademicYear = (year) => {
    if (!academicYearPattern.test(year)) return false;
    
    const [start, end] = year.split('-').map(Number);
    return end === start + 1;
};

// Validation schema for expense creation
const expenseSchema = Joi.object({
    category_id: Joi.number()
        .required()
        .messages({
            'any.required': 'Category ID is required',
            'number.base': 'Category ID must be a number'
        }),

    title: Joi.string()
        .required()
        .min(2)
        .max(100)
        .messages({
            'any.required': 'Title is required',
            'string.min': 'Title must be at least 2 characters long',
            'string.max': 'Title cannot exceed 100 characters'
        }),

    description: Joi.string()
        .max(500)
        .allow('')
        .messages({
            'string.max': 'Description cannot exceed 500 characters'
        }),

    amount: Joi.number()
        .required()
        .min(0)
        .messages({
            'any.required': 'Amount is required',
            'number.base': 'Amount must be a number',
            'number.min': 'Amount cannot be negative'
        }),

    tax_amount: Joi.number()
        .min(0)
        .default(0)
        .messages({
            'number.base': 'Tax amount must be a number',
            'number.min': 'Tax amount cannot be negative'
        }),

    expense_date: Joi.date()
        .required()
        .messages({
            'any.required': 'Expense date is required',
            'date.base': 'Invalid expense date'
        }),

    payment_mode: Joi.string()
        .required()
        .valid(
            'CASH',
            'CHEQUE',
            'BANK_TRANSFER',
            'CREDIT_CARD',
            'DEBIT_CARD',
            'UPI',
            'OTHER'
        )
        .messages({
            'any.required': 'Payment mode is required',
            'string.valid': 'Invalid payment mode'
        }),

    vendor_id: Joi.number()
        .messages({
            'number.base': 'Vendor ID must be a number'
        }),

    budget_id: Joi.number()
        .messages({
            'number.base': 'Budget ID must be a number'
        }),

    invoice_number: Joi.string()
        .max(50)
        .allow('')
        .messages({
            'string.max': 'Invoice number cannot exceed 50 characters'
        }),

    invoice_date: Joi.date()
        .messages({
            'date.base': 'Invalid invoice date'
        }),

    due_date: Joi.date()
        .min(Joi.ref('expense_date'))
        .messages({
            'date.base': 'Invalid due date',
            'date.min': 'Due date cannot be before expense date'
        }),

    payment_reference: Joi.string()
        .max(50)
        .allow('')
        .messages({
            'string.max': 'Payment reference cannot exceed 50 characters'
        }),

    cheque_number: Joi.string()
        .when('payment_mode', {
            is: 'CHEQUE',
            then: Joi.required(),
            otherwise: Joi.optional()
        })
        .messages({
            'any.required': 'Cheque number is required for cheque payments'
        }),

    bank_name: Joi.string()
        .when('payment_mode', {
            is: ['CHEQUE', 'BANK_TRANSFER'],
            then: Joi.required(),
            otherwise: Joi.optional()
        })
        .messages({
            'any.required': 'Bank name is required for cheque/bank transfer payments'
        }),

    transaction_id: Joi.string()
        .when('payment_mode', {
            is: ['BANK_TRANSFER', 'UPI'],
            then: Joi.required(),
            otherwise: Joi.optional()
        })
        .messages({
            'any.required': 'Transaction ID is required for bank transfer/UPI payments'
        }),

    notes: Joi.string()
        .max(500)
        .allow('')
        .messages({
            'string.max': 'Notes cannot exceed 500 characters'
        }),

    academic_year: Joi.string()
        .required()
        .custom((value, helpers) => {
            if (!validateAcademicYear(value)) {
                return helpers.error('string.academicYear');
            }
            return value;
        })
        .messages({
            'any.required': 'Academic year is required',
            'string.academicYear': 'Academic year must be in format YYYY-YYYY and consecutive years'
        })
});

// Validation schema for expense update
const expenseUpdateSchema = expenseSchema.fork(
    ['category_id', 'amount', 'expense_date', 'payment_mode', 'academic_year'],
    (field) => field.optional()
);

// Validation schema for expense cancellation
const expenseCancellationSchema = Joi.object({
    reason: Joi.string()
        .required()
        .min(10)
        .max(500)
        .messages({
            'any.required': 'Cancellation reason is required',
            'string.min': 'Cancellation reason must be at least 10 characters',
            'string.max': 'Cancellation reason cannot exceed 500 characters'
        })
});

// Middleware to validate expense creation
const validateExpense = async (req, res, next) => {
    try {
        await expenseSchema.validateAsync(req.body, {
            abortEarly: false,
            allowUnknown: false
        });
        next();
    } catch (error) {
        if (error instanceof Joi.ValidationError) {
            const errors = error.details.map(detail => ({
                field: detail.context.key,
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }
        next(error);
    }
};

// Middleware to validate expense update
const validateExpenseUpdate = async (req, res, next) => {
    try {
        await expenseUpdateSchema.validateAsync(req.body, {
            abortEarly: false,
            allowUnknown: false
        });
        next();
    } catch (error) {
        if (error instanceof Joi.ValidationError) {
            const errors = error.details.map(detail => ({
                field: detail.context.key,
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }
        next(error);
    }
};

// Middleware to validate expense cancellation
const validateExpenseCancellation = async (req, res, next) => {
    try {
        await expenseCancellationSchema.validateAsync(req.body, {
            abortEarly: false,
            allowUnknown: false
        });
        next();
    } catch (error) {
        if (error instanceof Joi.ValidationError) {
            const errors = error.details.map(detail => ({
                field: detail.context.key,
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }
        next(error);
    }
};

module.exports = {
    validateExpense,
    validateExpenseUpdate,
    validateExpenseCancellation
};
