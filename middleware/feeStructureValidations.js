const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

// Helper function to validate academic year format (YYYY-YYYY)
const academicYearPattern = /^\d{4}-\d{4}$/;
const validateAcademicYear = (year) => {
    if (!academicYearPattern.test(year)) return false;
    
    const [start, end] = year.split('-').map(Number);
    return end === start + 1;
};

// Validation schema for fee items
const feeItemSchema = Joi.object({
    item_name: Joi.string()
        .required()
        .min(2)
        .max(100)
        .messages({
            'string.empty': 'Fee item name is required',
            'string.min': 'Fee item name must be at least 2 characters long',
            'string.max': 'Fee item name cannot exceed 100 characters'
        }),

    description: Joi.string()
        .allow('')
        .max(500)
        .messages({
            'string.max': 'Description cannot exceed 500 characters'
        }),

    amount: Joi.number()
        .required()
        .min(0)
        .messages({
            'number.base': 'Amount must be a number',
            'number.min': 'Amount cannot be negative'
        }),

    is_mandatory: Joi.boolean()
        .default(true),

    is_recurring: Joi.boolean()
        .default(true),

    payment_frequency: Joi.string()
        .valid('ONCE', 'TERM', 'ANNUAL')
        .default('TERM'),

    due_date_offset: Joi.number()
        .integer()
        .min(0)
        .allow(null)
        .messages({
            'number.base': 'Due date offset must be a number',
            'number.min': 'Due date offset cannot be negative'
        }),

    category: Joi.string()
        .required()
        .messages({
            'string.empty': 'Fee category is required'
        }),

    display_order: Joi.number()
        .integer()
        .min(0)
        .default(0)
});

// Validation schema for fee structure
const feeStructureSchema = Joi.object({
    class: Joi.string()
        .required()
        .valid(
            'pg', 'pp1', 'pp2',
            'grade1', 'grade2', 'grade3', 'grade4', 'grade5', 'grade6',
            'grade7', 'grade8', 'grade9', 'grade10'
        )
        .messages({
            'any.required': 'Class is required',
            'string.valid': 'Invalid class selected'
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

    items: Joi.array()
        .min(1)
        .items(feeItemSchema)
        .required()
        .messages({
            'array.min': 'At least one fee item is required',
            'any.required': 'Fee items are required'
        })
});

// Validation schema for copying fee structure
const copyFeeStructureSchema = Joi.object({
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
        })
});

// Middleware to validate fee structure creation/update
const validateFeeStructure = async (req, res, next) => {
    try {
        await feeStructureSchema.validateAsync(req.body, {
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

// Middleware to validate fee structure copy
const validateFeeStructureCopy = async (req, res, next) => {
    try {
        await copyFeeStructureSchema.validateAsync(req.body, {
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

// Middleware to validate fee structure exists
const validateFeeStructureExists = async (req, res, next) => {
    try {
        const { id } = req.params;
        const feeStructure = await FeeStructure.findByPk(id);
        
        if (!feeStructure) {
            throw new ValidationError('Fee structure not found');
        }
        
        req.feeStructure = feeStructure;
        next();
    } catch (error) {
        next(error);
    }
};

// Middleware to check for duplicate fee structure
const checkDuplicateFeeStructure = async (req, res, next) => {
    try {
        const { class: className, academic_year, term } = req.body;
        
        const existingStructure = await FeeStructure.findOne({
            where: {
                class: className,
                academic_year,
                term,
                status: 'ACTIVE'
            }
        });

        if (existingStructure && (!req.params.id || req.params.id !== existingStructure.id)) {
            throw new ValidationError('Fee structure already exists for this class, term and academic year');
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    validateFeeStructure,
    validateFeeStructureCopy,
    validateFeeStructureExists,
    checkDuplicateFeeStructure
};
