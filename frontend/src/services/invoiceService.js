import axios from 'axios';

const API_BASE_URL = '/api/invoices';

class InvoiceService {
    /**
     * Generate a new invoice
     * @param {Object} data - Invoice data
     * @returns {Promise} API response
     */
    async generateInvoice(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/generate`, data);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get invoice details
     * @param {number} id - Invoice ID
     * @returns {Promise} API response
     */
    async getInvoice(id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get student's invoices
     * @param {number} studentId - Student ID
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    async getStudentInvoices(studentId, params = {}) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/student/${studentId}`,
                { params }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Cancel invoice
     * @param {number} id - Invoice ID
     * @param {string} reason - Cancellation reason
     * @returns {Promise} API response
     */
    async cancelInvoice(id, reason) {
        try {
            const response = await axios.post(`${API_BASE_URL}/${id}/cancel`, { reason });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Update invoice due date
     * @param {number} id - Invoice ID
     * @param {Date} dueDate - New due date
     * @returns {Promise} API response
     */
    async updateDueDate(id, dueDate) {
        try {
            const response = await axios.put(`${API_BASE_URL}/${id}/due-date`, { due_date: dueDate });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get outstanding invoices
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    async getOutstandingInvoices(params = {}) {
        try {
            const response = await axios.get(`${API_BASE_URL}/outstanding`, { params });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Process payment
     * @param {Object} data - Payment data
     * @returns {Promise} API response
     */
    async processPayment(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/payments`, data);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Verify payment
     * @param {number} id - Payment ID
     * @returns {Promise} API response
     */
    async verifyPayment(id) {
        try {
            const response = await axios.post(`${API_BASE_URL}/payments/${id}/verify`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Cancel payment
     * @param {number} id - Payment ID
     * @param {string} reason - Cancellation reason
     * @returns {Promise} API response
     */
    async cancelPayment(id, reason) {
        try {
            const response = await axios.post(`${API_BASE_URL}/payments/${id}/cancel`, { reason });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Process refund
     * @param {number} id - Payment ID
     * @param {Object} data - Refund data
     * @returns {Promise} API response
     */
    async processRefund(id, data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/payments/${id}/refund`, data);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get payment details
     * @param {number} id - Payment ID
     * @returns {Promise} API response
     */
    async getPayment(id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/payments/${id}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get student's payment history
     * @param {number} studentId - Student ID
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    async getStudentPayments(studentId, params = {}) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/student/${studentId}/payments`,
                { params }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get invoice statistics
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
     * Generate bulk invoices
     * @param {Object} data - Bulk generation data
     * @returns {Promise} API response
     */
    async generateBulkInvoices(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/bulk-generate`, data);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Send payment reminders
     * @param {Array} invoiceIds - Array of invoice IDs
     * @returns {Promise} API response
     */
    async sendReminders(invoiceIds) {
        try {
            const response = await axios.post(`${API_BASE_URL}/bulk-remind`, { invoice_ids: invoiceIds });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get collection report
     * @param {Object} params - Report parameters
     * @returns {Promise} API response
     */
    async getCollectionReport(params = {}) {
        try {
            const response = await axios.get(`${API_BASE_URL}/reports/collection`, { params });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get outstanding report
     * @param {Object} params - Report parameters
     * @returns {Promise} API response
     */
    async getOutstandingReport(params = {}) {
        try {
            const response = await axios.get(`${API_BASE_URL}/reports/outstanding`, { params });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Download payment receipt
     * @param {number} paymentId - Payment ID
     * @returns {Promise} Blob data
     */
    async downloadReceipt(paymentId) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/payments/${paymentId}/receipt`,
                { responseType: 'blob' }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Export transactions
     * @param {Object} params - Export parameters
     * @returns {Promise} Blob data
     */
    async exportTransactions(params = {}) {
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
const invoiceService = new InvoiceService();
export default invoiceService;
