import axios from 'axios';

const API_BASE_URL = '/api';

class PromotionService {
    /**
     * Promote a student to the next class
     * @param {number} studentId - Student ID
     * @param {Object} promotionData - Promotion details
     * @returns {Promise} API response
     */
    async promoteStudent(studentId, promotionData) {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/promotions/students/${studentId}/promote`,
                promotionData
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get promotion history for a student
     * @param {number} studentId - Student ID
     * @returns {Promise} API response
     */
    async getPromotionHistory(studentId) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/promotions/students/${studentId}/promotion-history`
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get balance transfer history for a student
     * @param {number} studentId - Student ID
     * @returns {Promise} API response
     */
    async getBalanceTransfers(studentId) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/promotions/students/${studentId}/balance-transfers`
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get detailed balance transfer information
     * @param {number} transferId - Balance transfer ID
     * @returns {Promise} API response
     */
    async getBalanceTransferDetails(transferId) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/promotions/balance-transfers/${transferId}`
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get promotion statistics
     * @param {Object} params - Query parameters (startDate, endDate)
     * @returns {Promise} API response
     */
    async getPromotionStatistics(params = {}) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/promotions/statistics`,
                { params }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get outstanding balances for a student
     * @param {number} studentId - Student ID
     * @returns {Promise} API response
     */
    async getOutstandingBalances(studentId) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/students/${studentId}/outstanding-balance`
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Validate promotion eligibility
     * @param {number} studentId - Student ID
     * @param {string} toClass - Target class
     * @returns {Promise} API response
     */
    async validatePromotion(studentId, toClass) {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/promotions/validate`,
                { studentId, toClass }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get promotion preview (fee structure and balances)
     * @param {number} studentId - Student ID
     * @param {string} toClass - Target class
     * @returns {Promise} API response
     */
    async getPromotionPreview(studentId, toClass) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/promotions/preview`,
                { params: { studentId, toClass } }
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

    /**
     * Get promotion report for a date range
     * @param {Object} params - Report parameters
     * @returns {Promise} API response
     */
    async getPromotionReport(params = {}) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/promotions/report`,
                { params }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get class-wise promotion summary
     * @param {string} academicYear - Academic year
     * @returns {Promise} API response
     */
    async getClassWisePromotions(academicYear) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/promotions/class-summary`,
                { params: { academicYear } }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get balance transfer report
     * @param {Object} params - Report parameters
     * @returns {Promise} API response
     */
    async getBalanceTransferReport(params = {}) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/promotions/balance-transfer-report`,
                { params }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Cancel a promotion (if allowed by school policy)
     * @param {number} promotionId - Promotion ID
     * @param {string} reason - Cancellation reason
     * @returns {Promise} API response
     */
    async cancelPromotion(promotionId, reason) {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/promotions/${promotionId}/cancel`,
                { reason }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }
}

// Create and export a singleton instance
const promotionService = new PromotionService();
export default promotionService;
