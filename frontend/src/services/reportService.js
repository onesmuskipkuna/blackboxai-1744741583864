import axios from 'axios';

const API_BASE_URL = '/api/reports';

class ReportService {
    /**
     * Get fee collection report
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    async getFeeCollectionReport(params = {}) {
        try {
            const response = await axios.get(`${API_BASE_URL}/fee-collections`, { 
                params,
                responseType: params.format === 'excel' ? 'blob' : 'json'
            });
            
            if (params.format === 'excel') {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'fee-collections.xlsx');
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                return;
            }
            
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get expense report
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    async getExpenseReport(params = {}) {
        try {
            const response = await axios.get(`${API_BASE_URL}/expenses`, { 
                params,
                responseType: params.format === 'pdf' ? 'blob' : 'json'
            });

            if (params.format === 'pdf') {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'expense-report.pdf');
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                return;
            }

            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get payroll report
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    async getPayrollReport(params = {}) {
        try {
            const response = await axios.get(`${API_BASE_URL}/payroll`, { 
                params,
                responseType: params.format === 'excel' ? 'blob' : 'json'
            });

            if (params.format === 'excel') {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'payroll-report.xlsx');
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                return;
            }

            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get budget report
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    async getBudgetReport(params = {}) {
        try {
            const response = await axios.get(`${API_BASE_URL}/budgets`, { 
                params,
                responseType: params.format === 'pdf' ? 'blob' : 'json'
            });

            if (params.format === 'pdf') {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'budget-report.pdf');
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                return;
            }

            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get financial summary
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    async getFinancialSummary(params = {}) {
        try {
            const response = await axios.get(`${API_BASE_URL}/financial-summary`, { params });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get student financial report
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    async getStudentFinancialReport(params = {}) {
        try {
            const response = await axios.get(`${API_BASE_URL}/student-financials`, { params });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Download report as file
     * @param {Blob} blob - Report data blob
     * @param {string} filename - Name of the file to download
     */
    downloadFile(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
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
const reportService = new ReportService();
export default reportService;
