const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

/**
 * Validate login request
 */
exports.validateLogin = async (req, res, next) => {
    try {
        const schema = Joi.object({
            email: Joi.string()
                .email()
                .required()
                .messages({
                    'string.email': 'Please enter a valid email address',
                    'any.required': 'Email is required'
                }),
            password: Joi.string()
                .required()
                .messages({
                    'any.required': 'Password is required'
                })
        });

        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        if (error instanceof Joi.ValidationError) {
            throw new ValidationError('Validation failed', error.details);
        }
        throw error;
    }
};

/**
 * Validate password change request
 */
exports.validatePasswordChange = async (req, res, next) => {
    try {
        const schema = Joi.object({
            current_password: Joi.string()
                .required()
                .messages({
                    'any.required': 'Current password is required'
                }),
            new_password: Joi.string()
                .min(8)
                .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
                .required()
                .messages({
                    'string.min': 'Password must be at least 8 characters long',
                    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
                    'any.required': 'New password is required'
                }),
            confirm_password: Joi.string()
                .valid(Joi.ref('new_password'))
                .required()
                .messages({
                    'any.only': 'Passwords do not match',
                    'any.required': 'Password confirmation is required'
                })
        });

        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        if (error instanceof Joi.ValidationError) {
            throw new ValidationError('Validation failed', error.details);
        }
        throw error;
    }
};

/**
 * Validate password reset request
 */
exports.validatePasswordReset = async (req, res, next) => {
    try {
        const schema = Joi.object({
            token: Joi.string()
                .required()
                .messages({
                    'any.required': 'Reset token is required'
                }),
            new_password: Joi.string()
                .min(8)
                .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
                .required()
                .messages({
                    'string.min': 'Password must be at least 8 characters long',
                    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
                    'any.required': 'New password is required'
                }),
            confirm_password: Joi.string()
                .valid(Joi.ref('new_password'))
                .required()
                .messages({
                    'any.only': 'Passwords do not match',
                    'any.required': 'Password confirmation is required'
                })
        });

        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        if (error instanceof Joi.ValidationError) {
            throw new ValidationError('Validation failed', error.details);
        }
        throw error;
    }
};

/**
 * Validate user registration request
 */
exports.validateRegistration = async (req, res, next) => {
    try {
        const schema = Joi.object({
            username: Joi.string()
                .min(3)
                .max(50)
                .required()
                .messages({
                    'string.min': 'Username must be at least 3 characters long',
                    'string.max': 'Username cannot exceed 50 characters',
                    'any.required': 'Username is required'
                }),
            email: Joi.string()
                .email()
                .required()
                .messages({
                    'string.email': 'Please enter a valid email address',
                    'any.required': 'Email is required'
                }),
            password: Joi.string()
                .min(8)
                .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
                .required()
                .messages({
                    'string.min': 'Password must be at least 8 characters long',
                    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
                    'any.required': 'Password is required'
                }),
            confirm_password: Joi.string()
                .valid(Joi.ref('password'))
                .required()
                .messages({
                    'any.only': 'Passwords do not match',
                    'any.required': 'Password confirmation is required'
                }),
            first_name: Joi.string()
                .min(2)
                .max(50)
                .required()
                .messages({
                    'string.min': 'First name must be at least 2 characters long',
                    'string.max': 'First name cannot exceed 50 characters',
                    'any.required': 'First name is required'
                }),
            last_name: Joi.string()
                .min(2)
                .max(50)
                .required()
                .messages({
                    'string.min': 'Last name must be at least 2 characters long',
                    'string.max': 'Last name cannot exceed 50 characters',
                    'any.required': 'Last name is required'
                }),
            role_id: Joi.number()
                .integer()
                .required()
                .messages({
                    'number.base': 'Role ID must be a number',
                    'any.required': 'Role ID is required'
                })
        });

        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        if (error instanceof Joi.ValidationError) {
            throw new ValidationError('Validation failed', error.details);
        }
        throw error;
    }
};

/**
 * Validate profile update request
 */
exports.validateProfileUpdate = async (req, res, next) => {
    try {
        const schema = Joi.object({
            first_name: Joi.string()
                .min(2)
                .max(50)
                .required()
                .messages({
                    'string.min': 'First name must be at least 2 characters long',
                    'string.max': 'First name cannot exceed 50 characters',
                    'any.required': 'First name is required'
                }),
            last_name: Joi.string()
                .min(2)
                .max(50)
                .required()
                .messages({
                    'string.min': 'Last name must be at least 2 characters long',
                    'string.max': 'Last name cannot exceed 50 characters',
                    'any.required': 'Last name is required'
                }),
            preferences: Joi.object()
                .optional()
        });

        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        if (error instanceof Joi.ValidationError) {
            throw new ValidationError('Validation failed', error.details);
        }
        throw error;
    }
};
