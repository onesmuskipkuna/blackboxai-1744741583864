import axios from 'axios';

const API_BASE_URL = '/api/auth';

class AuthService {
    /**
     * User login
     * @param {Object} credentials - Login credentials
     * @returns {Promise} API response
     */
    async login(credentials) {
        try {
            const response = await axios.post(`${API_BASE_URL}/login`, credentials);
            if (response.data.data.token) {
                localStorage.setItem('token', response.data.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.data.user));
            }
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * User logout
     */
    async logout() {
        try {
            await axios.post(`${API_BASE_URL}/logout`);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } catch (error) {
            // Still remove local storage items even if API call fails
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.handleError(error);
        }
    }

    /**
     * Get current user
     * @returns {Object} User data
     */
    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    /**
     * Get authentication token
     * @returns {string} JWT token
     */
    getToken() {
        return localStorage.getItem('token');
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Check if user has required permissions
     * @param {Array} requiredPermissions - Array of required permission codes
     * @returns {boolean} Permission status
     */
    hasPermissions(requiredPermissions) {
        const user = this.getCurrentUser();
        if (!user || !user.permissions) return false;

        return requiredPermissions.every(permission =>
            user.permissions.includes(permission)
        );
    }

    /**
     * Check if user has required role
     * @param {Array} allowedRoles - Array of allowed role names
     * @returns {boolean} Role status
     */
    hasRole(allowedRoles) {
        const user = this.getCurrentUser();
        if (!user || !user.role) return false;

        return allowedRoles.includes(user.role);
    }

    /**
     * Request password reset
     * @param {string} email - User email
     * @returns {Promise} API response
     */
    async requestPasswordReset(email) {
        try {
            const response = await axios.post(`${API_BASE_URL}/request-password-reset`, { email });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Reset password
     * @param {Object} data - Reset password data
     * @returns {Promise} API response
     */
    async resetPassword(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/reset-password`, data);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Change password
     * @param {Object} data - Password change data
     * @returns {Promise} API response
     */
    async changePassword(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/change-password`, data);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get user profile
     * @returns {Promise} API response
     */
    async getProfile() {
        try {
            const response = await axios.get(`${API_BASE_URL}/profile`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Update user profile
     * @param {Object} data - Profile update data
     * @returns {Promise} API response
     */
    async updateProfile(data) {
        try {
            const response = await axios.put(`${API_BASE_URL}/profile`, data);
            
            // Update local storage with new user data
            const currentUser = this.getCurrentUser();
            const updatedUser = {
                ...currentUser,
                first_name: data.first_name,
                last_name: data.last_name
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Setup axios interceptors for authentication
     */
    setupAxiosInterceptors() {
        // Request interceptor
        axios.interceptors.request.use(
            (config) => {
                const token = this.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor
        axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Token expired or invalid
                    this.logout();
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * Handle API errors
     * @param {Error} error - Error object
     * @throws {Error} Formatted error
     */
    handleError(error) {
        if (error.response) {
            // Server responded with error status
            const message = error.response.data.error || 'An error occurred';
            throw new Error(message);
        } else if (error.request) {
            // Request made but no response
            throw new Error('No response from server. Please try again.');
        } else {
            // Request setup error
            throw new Error('Failed to make request. Please try again.');
        }
    }
}

// Create and export a singleton instance
const authService = new AuthService();

// Setup axios interceptors
authService.setupAxiosInterceptors();

export default authService;
