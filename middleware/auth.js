const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models');
const { AuthenticationError } = require('../utils/errors');

/**
 * Authenticate user using JWT token
 */
exports.authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('No token provided');
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user
        const user = await User.findByPk(decoded.id, {
            include: [{
                model: Role,
                as: 'role',
                include: [{
                    model: Permission,
                    as: 'permissions'
                }]
            }]
        });

        if (!user) {
            throw new AuthenticationError('User not found');
        }

        if (user.status !== 'ACTIVE') {
            throw new AuthenticationError('User account is not active');
        }

        // Check if password change is required
        if (user.must_change_password && req.path !== '/auth/change-password') {
            throw new AuthenticationError('Password change required');
        }

        // Check if password is expired
        if (user.isPasswordExpired() && req.path !== '/auth/change-password') {
            throw new AuthenticationError('Password expired. Please change your password.');
        }

        // Add user to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role.name,
            permissions: user.role.permissions.map(p => p.code)
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new AuthenticationError('Invalid token');
        }
        throw error;
    }
};

/**
 * Check if user has required permissions
 */
exports.checkPermissions = (requiredPermissions) => {
    return (req, res, next) => {
        const userPermissions = req.user.permissions;

        const hasPermission = requiredPermissions.every(permission =>
            userPermissions.includes(permission)
        );

        if (!hasPermission) {
            throw new AuthenticationError('Insufficient permissions');
        }

        next();
    };
};

/**
 * Check if user has any of the required roles
 */
exports.checkRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            throw new AuthenticationError('Insufficient role permissions');
        }

        next();
    };
};

/**
 * Check if user is admin
 */
exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        throw new AuthenticationError('Admin access required');
    }

    next();
};

/**
 * Check if user owns the resource or is admin
 */
exports.checkOwnership = (req, res, next) => {
    const resourceUserId = parseInt(req.params.userId);
    
    if (req.user.role !== 'admin' && req.user.id !== resourceUserId) {
        throw new AuthenticationError('Unauthorized access to resource');
    }

    next();
};
