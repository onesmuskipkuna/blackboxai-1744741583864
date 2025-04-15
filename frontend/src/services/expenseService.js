import axios from 'axios';

const API_BASE_URL = '/api/expenses';

class ExpenseService {
    /**
     * Create a new expense
     * @param {Object} data - Expense data
     * @param {Array} files - Attachment files
     * @returns {Promise} API response
     */
    async createExpense(data, files) {
        try {
            const formData = new FormData();
            
            // Append expense data
            Object.keys(data).forEach(key => {
                formData.append(key, data[key]);
            });

            // Append files
            if (files?.length) {
                files.forEach(file => {
                    formData.append('attachments', file);
                });
            }

            const response = await axios.post(API_BASE_URL, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Update expense
     * @param {number} id - Expense ID
     * @param {Object} data - Updated data
     * @param {Array} files - New attachment files
     * @returns {Promise} API response
     */
    async updateExpense(id, data, files) {
        try {
            const formData = new FormData();
            
            Object.keys(data).forEach(key => {
                formData.append(key, data[key]);
            });

            if (files?.length) {
                files.forEach(file => {
                    formData.append('attachments', file);
                });
            }

            const response = await axios.put(`${API_BASE_URL}/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get expense details
     * @param {number} id - Expense ID
     * @returns {Promise} API response
     */
    async getExpense(id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * List expenses with filters
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    async listExpenses(params = {}) {
        try {
            const response = await axios.get(API_BASE_URL, { params });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Approve expense
     * @param {number} id - Expense ID
     * @returns {Promise} API response
     */
    async approveExpense(id) {
        try {
            const response = await axios.post(`${API_BASE_URL}/${id}/approve`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Cancel expense
     * @param {number} id - Expense ID
     * @param {string} reason - Cancellation reason
     * @returns {Promise} API response
     */
    async cancelExpense(id, reason) {
        try {
            const response = await axios.post(`${API_BASE_URL}/${id}/cancel`, { reason });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get expense statistics
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    async getStatistics(params = {}) {
        try {
            const response = await axios.get(`${API_BASE_URL}/statistics`, { params });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Create budget
     * @param {Object} data - Budget data
     * @returns {Promise} API response
     */
    async createBudget(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/budgets`, data);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Update budget
     * @param {number} id - Budget ID
     * @param {Object} data - Updated data
     * @returns {Promise} API response
     */
    async updateBudget(id, data) {
        try {
            const response = await axios.put(`${API_BASE_URL}/budgets/${id}`, data);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get budget details
     * @param {number} id - Budget ID
     * @returns {Promise} API response
     */
    async getBudget(id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/budgets/${id}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * List budgets
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    async listBudgets(params = {}) {
        try {
            const response = await axios.get(`${API_BASE_URL}/budgets`, { params });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Approve budget
     * @param {number} id - Budget ID
     * @returns {Promise} API response
     */
    async approveBudget(id) {
        try {
            const response = await axios.post(`${API_BASE_URL}/budgets/${id}/approve`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Close budget
     * @param {number} id - Budget ID
     * @param {string} notes - Closure notes
     * @returns {Promise} API response
     */
    async closeBudget(id, notes) {
        try {
            const response = await axios.post(`${API_BASE_URL}/budgets/${id}/close`, { notes });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get budget statistics
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    async getBudgetStatistics(params = {}) {
        try {
            const response = await axios.get(`${API_BASE_URL}/budgets/statistics`, { params });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * List expense categories
     * @returns {Promise} API response
     */
    async listCategories() {
        try {
            const response = await axios.get(`${API_BASE_URL}/categories`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * List vendors
     * @returns {Promise} API response
     */
    async listVendors() {
        try {
            const response = await axios.get(`${API_BASE_URL}/vendors`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Download attachment
     * @param {number} id - Attachment ID
     * @returns {Promise} Blob data
     */
    async downloadAttachment(id) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/attachments/${id}`,
                { responseType: 'blob' }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Delete attachment
     * @param {number} id - Attachment ID
     * @returns {Promise} API response
     */
    async deleteAttachment(id) {
        try {
            const response = await axios.delete(`${API_BASE_URL}/attachments/${id}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Export expenses
     * @param {Object} params - Export parameters
     * @returns {Promise} Blob data
     */
    async exportExpenses(params = {}) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/export`,
                { 
                    params,
                    responseType: 'blob'
                }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Export budgets
     * @param {Object} params - Export parameters
     * @returns {Promise} Blob data
     */
    async exportBudgets(params = {}) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/budgets/export`,
                { 
                    params,
                    responseType: 'blob'
                }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
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
const expenseService = new ExpenseService();
export default expenseService;
