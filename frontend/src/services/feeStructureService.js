import axios from 'axios';

const API_BASE_URL = '/api/fee-structures';

class FeeStructureService {
    /**
     * Create a new fee structure
     * @param {Object} data - Fee structure data
     * @returns {Promise} API response
     */
    async createFeeStructure(data) {
        try {
            const response = await axios.post(API_BASE_URL, data);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get fee structure by ID
     * @param {number} id - Fee structure ID
     * @returns {Promise} API response
     */
    async getFeeStructure(id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get fee structure by class, term and academic year
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    async getFeeStructureByClass(params) {
        try {
            const response = await axios.get(`${API_BASE_URL}/by-class`, { params });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Update fee structure
     * @param {number} id - Fee structure ID
     * @param {Object} data - Updated fee structure data
     * @returns {Promise} API response
     */
    async updateFeeStructure(id, data) {
        try {
            const response = await axios.put(`${API_BASE_URL}/${id}`, data);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Delete fee structure
     * @param {number} id - Fee structure ID
     * @returns {Promise} API response
     */
    async deleteFeeStructure(id) {
        try {
            const response = await axios.delete(`${API_BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Copy fee structure
     * @param {number} id - Source fee structure ID
     * @param {Object} data - New academic year and term
     * @returns {Promise} API response
     */
    async copyFeeStructure(id, data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/${id}/copy`, data);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * List fee structures with filtering and pagination
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    async listFeeStructures(params = {}) {
        try {
            const response = await axios.get(API_BASE_URL, { params });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get fee structure statistics
     * @returns {Promise} API response
     */
    async getStatistics() {
        try {
            const response = await axios.get(`${API_BASE_URL}/statistics`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get fee categories
     * @returns {Promise} API response
     */
    async getFeeCategories() {
        try {
            const response = await axios.get(`${API_BASE_URL}/categories`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Validate fee structure
     * @param {Object} data - Fee structure data to validate
     * @returns {Promise} API response
     */
    async validateStructure(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/validate`, data);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Compare fee structures
     * @param {Array} structureIds - Array of fee structure IDs to compare
     * @returns {Promise} API response
     */
    async compareStructures(structureIds) {
        try {
            const response = await axios.post(`${API_BASE_URL}/compare`, { structureIds });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get fee structure template
     * @param {string} className - Class name
     * @returns {Promise} API response
     */
    async getTemplate(className) {
        try {
            const response = await axios.get(`${API_BASE_URL}/template`, {
                params: { class: className }
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Import fee structure from Excel
     * @param {File} file - Excel file
     * @returns {Promise} API response
     */
    async importFromExcel(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await axios.post(`${API_BASE_URL}/import`, formData, {
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
     * Export fee structure to Excel
     * @param {number} id - Fee structure ID
     * @returns {Promise} Blob data
     */
    async exportToExcel(id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/${id}/export`, {
                responseType: 'blob'
            });
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
const feeStructureService = new FeeStructureService();
export default feeStructureService;
