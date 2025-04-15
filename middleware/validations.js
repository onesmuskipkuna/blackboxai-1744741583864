const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

// Helper function to validate academic year format (YYYY-YYYY)
const academicYearPattern = /^\d{4}-\d{4}$/;
const validateAcademicYear = (year) => {
    if (!academicYearPattern.test(year)) return false;
    
    const [start, end] = year.split('-').map(Number);
    return end === start + 1;
};

// Validation schema for student promotion
const promotionSchema = Joi.object({
    toClass: Joi.string()
        .required()
        .valid(
            'pg', 'pp1', 'pp2',
            'grade1', 'grade2', 'grade3', 'grade4', 'grade5', 'grade6',
            'grade7', 'grade8', 'grade9', 'grade10'
        )
        .messages({
            'any.required': 'New class is required',
            'string.valid': 'Invalid class selected'
        }),

    toAcademicYear: Joi.string()
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

    remarks: Joi.string()
        .allow('')
        .max(500)
        .messages({
            'string.max': 'Remarks cannot exceed 500 characters'
        })
});

const validatePromotion = async (req, res, next) => {
    try {
        // Extract studentId from params and add to validation
        const { studentId } = req.params;
        if (!studentId) {
            throw new ValidationError('Student ID is required');
        }

        // Validate request body
        const validatedData = await promotionSchema.validateAsync(req.body, {
            abortEarly: false,
            allowUnknown: false
        });

        // Add validated data and studentId to request
        req.body = {
            ...validatedData,
            studentId
        };

        next();
    } catch (error) {
        if (error instanceof Joi.ValidationError) {
            // Format Joi validation errors
            const errors = error.details.map(detail => ({
                field: detail.context.key,
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        // Handle other validation errors
        return res.status(400).json({
            error: error.message
        });
    }
};

// Validation schema for balance transfer query
const balanceTransferQuerySchema = Joi.object({
    startDate: Joi.date()
        .iso()
        .messages({
            'date.base': 'Start date must be a valid date',
            'date.format': 'Start date must be in ISO format'
        }),

    endDate: Joi.date()
        .iso()
        .min(Joi.ref('startDate'))
        .messages({
            'date.base': 'End date must be a valid date',
            'date.format': 'End date must be in ISO format',
            'date.min': 'End date must be after start date'
        })
});

const validateBalanceTransferQuery = async (req, res, next) => {
    try {
        if (req.query.startDate || req.query.endDate) {
            await balanceTransferQuerySchema.validateAsync(req.query, {
                abortEarly: false
            });
        }
        next();
    } catch (error) {
        if (error instanceof Joi.ValidationError) {
            const errors = error.details.map(detail => ({
                field: detail.context.key,
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Invalid date range',
                details: errors
            });
        }

        return res.status(400).json({
            error: error.message
        });
    }
};

module.exports = {
    validatePromotion,
    validateBalanceTransferQuery
};
