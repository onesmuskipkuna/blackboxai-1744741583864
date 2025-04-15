/**
 * Custom error classes and error handling utilities for the fee management system
 */

class BaseError extends Error {
    constructor(message, statusCode, errorCode) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation Error - Used when input validation fails
 */
class ValidationError extends BaseError {
    constructor(message) {
        super(message, 400, 'VALIDATION_ERROR');
    }
}

/**
 * Business Logic Error - Used when business rules are violated
 */
class BusinessError extends BaseError {
    constructor(message) {
        super(message, 422, 'BUSINESS_RULE_VIOLATION');
    }
}

/**
 * Not Found Error - Used when requested resource is not found
 */
class NotFoundError extends BaseError {
    constructor(message) {
        super(message, 404, 'RESOURCE_NOT_FOUND');
    }
}

/**
 * Authorization Error - Used for permission-related errors
 */
class AuthorizationError extends BaseError {
    constructor(message) {
        super(message, 403, 'UNAUTHORIZED_ACCESS');
    }
}

/**
 * Database Error - Used for database-related errors
 */
class DatabaseError extends BaseError {
    constructor(message) {
        super(message, 500, 'DATABASE_ERROR');
    }
}

/**
 * Promotion-specific error messages
 */
const PromotionErrors = {
    INVALID_CLASS_PROGRESSION: 'Invalid class progression. Students can only be promoted to higher classes.',
    INVALID_ACADEMIC_YEAR: 'Invalid academic year format. Must be in YYYY-YYYY format.',
    STUDENT_NOT_FOUND: 'Student not found.',
    ALREADY_PROMOTED: 'Student has already been promoted for this academic year.',
    INVALID_FEE_STRUCTURE: 'Fee structure not found for the target class.',
    PROMOTION_NOT_ALLOWED: 'Student promotion is not allowed at this time.',
    BALANCE_TRANSFER_FAILED: 'Failed to transfer outstanding balances.',
};

/**
 * Balance transfer-specific error messages
 */
const BalanceTransferErrors = {
    INVALID_AMOUNT: 'Invalid balance amount.',
    TRANSFER_NOT_FOUND: 'Balance transfer record not found.',
    DUPLICATE_TRANSFER: 'Balance has already been transferred.',
    INVALID_STATUS: 'Invalid transfer status.',
};

/**
 * Error handler middleware for Express
 */
const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error('Error:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode
    });

    // Handle specific error types
    if (err instanceof ValidationError) {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message,
            errorCode: err.errorCode
        });
    }

    if (err instanceof BusinessError) {
        return res.status(422).json({
            error: 'Business Rule Violation',
            message: err.message,
            errorCode: err.errorCode
        });
    }

    if (err instanceof NotFoundError) {
        return res.status(404).json({
            error: 'Resource Not Found',
            message: err.message,
            errorCode: err.errorCode
        });
    }

    if (err instanceof AuthorizationError) {
        return res.status(403).json({
            error: 'Unauthorized Access',
            message: err.message,
            errorCode: err.errorCode
        });
    }

    if (err instanceof DatabaseError) {
        return res.status(500).json({
            error: 'Database Error',
            message: 'An error occurred while processing your request.',
            errorCode: err.errorCode
        });
    }

    // Handle Sequelize-specific errors
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.errors.map(e => e.message),
            errorCode: 'SEQUELIZE_VALIDATION_ERROR'
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            error: 'Duplicate Entry',
            message: 'A record with these details already exists.',
            errorCode: 'SEQUELIZE_UNIQUE_CONSTRAINT_ERROR'
        });
    }

    // Default error response for unhandled errors
    return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred.',
        errorCode: 'INTERNAL_SERVER_ERROR'
    });
};

/**
 * Async handler wrapper to catch async errors
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Validate promotion data
 * @param {Object} data - Promotion data to validate
 * @throws {ValidationError} If validation fails
 */
const validatePromotionData = (data) => {
    const { studentId, toClass, toAcademicYear } = data;

    if (!studentId) {
        throw new ValidationError('Student ID is required');
    }

    if (!toClass) {
        throw new ValidationError('Target class is required');
    }

    if (!toAcademicYear || !/^\d{4}-\d{4}$/.test(toAcademicYear)) {
        throw new ValidationError(PromotionErrors.INVALID_ACADEMIC_YEAR);
    }
};

/**
 * Validate balance transfer data
 * @param {Object} data - Balance transfer data to validate
 * @throws {ValidationError} If validation fails
 */
const validateBalanceTransfer = (data) => {
    const { amount, studentId, fromTerm, toTerm } = data;

    if (!studentId) {
        throw new ValidationError('Student ID is required');
    }

    if (!amount || isNaN(amount) || amount <= 0) {
        throw new ValidationError(BalanceTransferErrors.INVALID_AMOUNT);
    }

    if (!fromTerm || !toTerm) {
        throw new ValidationError('From and To terms are required');
    }
};

module.exports = {
    ValidationError,
    BusinessError,
    NotFoundError,
    AuthorizationError,
    DatabaseError,
    PromotionErrors,
    BalanceTransferErrors,
    errorHandler,
    asyncHandler,
    validatePromotionData,
    validateBalanceTransfer
};
