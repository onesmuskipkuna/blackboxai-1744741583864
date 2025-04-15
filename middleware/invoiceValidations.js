const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

// Helper function to validate academic year format (YYYY-YYYY)
const academicYearPattern = /^\d{4}-\d{4}$/;
const validateAcademicYear = (year) => {
    if (!academicYearPattern.test(year)) return false;
    
    const [start, end] = year.split('-').map(Number);
    return end === start + 1;
};

// Validation schema for invoice generation
const invoiceSchema = Joi.object({
    student_id: Joi.number()
        .required()
        .messages({
            'any.required': 'Student ID is required',
            'number.base': 'Student ID must be a number'
        }),

    fee_structure_id: Joi.number()
        .required()
        .messages({
            'any.required': 'Fee structure ID is required',
            'number.base': 'Fee structure ID must be a number'
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
        }),

    term: Joi.string()
        .required()
        .valid('TERM_1', 'TERM_2', 'TERM_3')
        .messages({
            'any.required': 'Term is required',
            'string.valid': 'Invalid term selected'
        }),

    due_date: Joi.date()
        .min('now')
        .messages({
            'date.base': 'Due date must be a valid date',
            'date.min': 'Due date cannot be in the past'
        }),

    remarks: Joi.string()
        .max(500)
        .allow('')
        .messages({
            'string.max': 'Remarks cannot exceed 500 characters'
        })
});

// Validation schema for payment processing
const paymentSchema = Joi.object({
    invoice_id: Joi.number()
        .required()
        .messages({
            'any.required': 'Invoice ID is required',
            'number.base': 'Invoice ID must be a number'
        }),

    amount: Joi.number()
        .required()
        .min(0)
        .messages({
            'any.required': 'Payment amount is required',
            'number.base': 'Payment amount must be a number',
            'number.min': 'Payment amount cannot be negative'
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
            'MOBILE_WALLET',
            'OTHER'
        )
        .messages({
            'any.required': 'Payment mode is required',
            'string.valid': 'Invalid payment mode selected'
        }),

    payment_details: Joi.object({
        cheque_number: Joi.string()
            .when('payment_mode', {
                is: 'CHEQUE',
                then: Joi.required(),
                otherwise: Joi.optional()
            }),

        bank_name: Joi.string()
            .when('payment_mode', {
                is: 'CHEQUE',
                then: Joi.required(),
                otherwise: Joi.optional()
            }),

        bank_branch: Joi.string()
            .when('payment_mode', {
                is: 'CHEQUE',
                then: Joi.required(),
                otherwise: Joi.optional()
            }),

        transaction_id: Joi.string()
            .when('payment_mode', {
                is: ['BANK_TRANSFER', 'UPI', 'MOBILE_WALLET'],
                then: Joi.required(),
                otherwise: Joi.optional()
            }),

        card_last_digits: Joi.string()
            .length(4)
            .pattern(/^\d+$/)
            .when('payment_mode', {
                is: ['CREDIT_CARD', 'DEBIT_CARD'],
                then: Joi.required(),
                otherwise: Joi.optional()
            })
    }).messages({
        'any.required': 'Payment details are required for the selected payment mode'
    }),

    items: Joi.array()
        .items(
            Joi.object({
                invoice_item_id: Joi.number()
                    .required()
                    .messages({
                        'any.required': 'Invoice item ID is required',
                        'number.base': 'Invoice item ID must be a number'
                    }),

                amount: Joi.number()
                    .required()
                    .min(0)
                    .messages({
                        'any.required': 'Item payment amount is required',
                        'number.base': 'Item payment amount must be a number',
                        'number.min': 'Item payment amount cannot be negative'
                    }),

                sequence: Joi.number()
                    .integer()
                    .min(0)
                    .default(0)
            })
        )
        .min(1)
        .required()
        .messages({
            'array.min': 'At least one payment item is required',
            'any.required': 'Payment items are required'
        })
});

// Validation schema for payment cancellation
const paymentCancellationSchema = Joi.object({
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

// Validation schema for payment refund
const refundSchema = Joi.object({
    amount: Joi.number()
        .required()
        .min(0)
        .messages({
            'any.required': 'Refund amount is required',
            'number.base': 'Refund amount must be a number',
            'number.min': 'Refund amount cannot be negative'
        }),

    reference: Joi.string()
        .required()
        .messages({
            'any.required': 'Refund reference is required'
        }),

    reason: Joi.string()
        .required()
        .min(10)
        .max(500)
        .messages({
            'any.required': 'Refund reason is required',
            'string.min': 'Refund reason must be at least 10 characters',
            'string.max': 'Refund reason cannot exceed 500 characters'
        })
});

// Middleware to validate invoice generation
const validateInvoice = async (req, res, next) => {
    try {
        await invoiceSchema.validateAsync(req.body, {
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

// Middleware to validate payment processing
const validatePayment = async (req, res, next) => {
    try {
        await paymentSchema.validateAsync(req.body, {
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

// Middleware to validate payment cancellation
const validatePaymentCancellation = async (req, res, next) => {
    try {
        await paymentCancellationSchema.validateAsync(req.body, {
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

// Middleware to validate payment refund
const validateRefund = async (req, res, next) => {
    try {
        await refundSchema.validateAsync(req.body, {
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
    validateInvoice,
    validatePayment,
    validatePaymentCancellation,
    validateRefund
};
