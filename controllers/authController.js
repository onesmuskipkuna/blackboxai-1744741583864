const { User, Role, Permission, UserActivity } = require('../models');
const { ValidationError, AuthenticationError } = require('../utils/errors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

class AuthController {
    /**
     * User login
     */
    async login(req, res) {
        const { email, password } = req.body;
        const ipAddress = req.ip;
        const userAgent = req.headers['user-agent'];

        try {
            // Find user
            const user = await User.findOne({
                where: { email },
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
                throw new AuthenticationError('Invalid email or password');
            }

            // Check if account is locked
            if (user.status === 'LOCKED') {
                if (user.account_locked_until && user.account_locked_until > new Date()) {
                    throw new AuthenticationError(
                        `Account is locked. Please try again after ${user.account_locked_until.toLocaleString()}`
                    );
                } else {
                    // Reset lock if lock duration has passed
                    await user.resetFailedLoginAttempts();
                }
            }

            // Check if account is inactive
            if (user.status === 'INACTIVE') {
                throw new AuthenticationError('Account is inactive. Please contact administrator.');
            }

            // Verify password
            const isValidPassword = await user.comparePassword(password);
            if (!isValidPassword) {
                await user.incrementFailedLoginAttempts();
                await UserActivity.logLogin(user.id, false, ipAddress, userAgent, 'Invalid password');
                throw new AuthenticationError('Invalid email or password');
            }

            // Reset failed login attempts
            await user.resetFailedLoginAttempts();

            // Update last login
            await user.update({
                last_login: new Date(),
                failed_login_attempts: 0
            });

            // Generate token
            const token = user.generateToken();

            // Log successful login
            await UserActivity.logLogin(user.id, true, ipAddress, userAgent);

            // Return user data and token
            res.json({
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        role: user.role.name,
                        permissions: user.role.permissions.map(p => p.code)
                    },
                    token
                }
            });

        } catch (error) {
            if (error instanceof AuthenticationError) {
                throw error;
            }
            logger.error('Login error:', error);
            throw new AuthenticationError('Login failed. Please try again.');
        }
    }

    /**
     * User logout
     */
    async logout(req, res) {
        try {
            await UserActivity.logLogout(
                req.user.id,
                req.ip,
                req.headers['user-agent']
            );
            res.json({ message: 'Logout successful' });
        } catch (error) {
            logger.error('Logout error:', error);
            throw error;
        }
    }

    /**
     * Change password
     */
    async changePassword(req, res) {
        const { current_password, new_password } = req.body;
        const userId = req.user.id;

        try {
            const user = await User.findByPk(userId);
            if (!user) {
                throw new AuthenticationError('User not found');
            }

            // Verify current password
            const isValidPassword = await user.comparePassword(current_password);
            if (!isValidPassword) {
                throw new ValidationError('Current password is incorrect');
            }

            // Update password
            await user.update({
                password: new_password,
                must_change_password: false
            });

            // Log password change
            await UserActivity.logPasswordChange(
                userId,
                true,
                req.ip,
                req.headers['user-agent']
            );

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            await UserActivity.logPasswordChange(
                userId,
                false,
                req.ip,
                req.headers['user-agent'],
                error.message
            );
            throw error;
        }
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(req, res) {
        const { email } = req.body;

        try {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                // Don't reveal if email exists
                return res.json({
                    message: 'If the email exists, you will receive password reset instructions.'
                });
            }

            // Generate reset token
            const resetToken = await user.generatePasswordResetToken();

            // Send reset email
            const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
            await sendEmail({
                to: user.email,
                subject: 'Password Reset Request',
                template: 'password-reset',
                context: {
                    name: user.getFullName(),
                    resetUrl,
                    validityPeriod: '10 minutes'
                }
            });

            res.json({
                message: 'If the email exists, you will receive password reset instructions.'
            });
        } catch (error) {
            logger.error('Password reset request error:', error);
            throw error;
        }
    }

    /**
     * Reset password using token
     */
    async resetPassword(req, res) {
        const { token, new_password } = req.body;

        try {
            const hashedToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            const user = await User.findOne({
                where: {
                    password_reset_token: hashedToken,
                    password_reset_expires: {
                        [Op.gt]: new Date()
                    }
                }
            });

            if (!user) {
                throw new ValidationError('Invalid or expired reset token');
            }

            // Update password
            await user.update({
                password: new_password,
                password_reset_token: null,
                password_reset_expires: null,
                must_change_password: false
            });

            // Log password reset
            await UserActivity.logActivity({
                user_id: user.id,
                activity_type: 'PASSWORD_RESET',
                module: 'AUTH',
                description: 'Password reset successful',
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            res.json({ message: 'Password reset successful' });
        } catch (error) {
            logger.error('Password reset error:', error);
            throw error;
        }
    }

    /**
     * Get current user profile
     */
    async getProfile(req, res) {
        try {
            const user = await User.findByPk(req.user.id, {
                include: [{
                    model: Role,
                    as: 'role',
                    include: [{
                        model: Permission,
                        as: 'permissions'
                    }]
                }],
                attributes: { exclude: ['password'] }
            });

            if (!user) {
                throw new AuthenticationError('User not found');
            }

            res.json({ data: user });
        } catch (error) {
            logger.error('Get profile error:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(req, res) {
        const { first_name, last_name, preferences } = req.body;

        try {
            const user = await User.findByPk(req.user.id);
            if (!user) {
                throw new AuthenticationError('User not found');
            }

            const oldValues = {
                first_name: user.first_name,
                last_name: user.last_name,
                preferences: user.preferences
            };

            await user.update({
                first_name,
                last_name,
                preferences
            });

            // Log profile update
            await UserActivity.logEntityChange(
                req.user.id,
                'USER',
                user.id,
                'UPDATE_PROFILE',
                oldValues,
                { first_name, last_name, preferences },
                req.ip
            );

            res.json({
                message: 'Profile updated successfully',
                data: user
            });
        } catch (error) {
            logger.error('Update profile error:', error);
            throw error;
        }
    }
}

module.exports = new AuthController();
