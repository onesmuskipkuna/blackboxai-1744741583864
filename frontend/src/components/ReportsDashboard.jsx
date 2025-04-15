import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import reportService from '../services/reportService';
import { formatAmount, formatDate } from '../utils/academicUtils';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const ReportsDashboard = () => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        academic_year: '',
        category_id: '',
        department_id: '',
        student_id: ''
    });
    const [summaryData, setSummaryData] = useState(null);
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        if (activeTab === 'summary') {
            fetchFinancialSummary();
        }
    }, [activeTab, filters.start_date, filters.end_date]);

    const fetchFinancialSummary = async () => {
        try {
            setLoading(true);
            const response = await reportService.getFinancialSummary({
                start_date: filters.start_date,
                end_date: filters.end_date
            });

            setSummaryData(response.data);
            prepareChartData(response.data);
        } catch (error) {
            toast.error('Failed to fetch financial summary');
        } finally {
            setLoading(false);
        }
    };

    const prepareChartData = (data) => {
        // Income vs Expenses Chart
        const balanceData = {
            labels: ['Income', 'Expenses', 'Net Balance'],
            datasets: [{
                data: [
                    data.total_income,
                    data.total_expenses,
                    data.net_balance
                ],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)'
                ]
            }]
        };

        // Expense Breakdown Chart
        const expenseData = {
            labels: ['Operational', 'Payroll'],
            datasets: [{
                data: [
                    data.expense_breakdown.operational,
                    data.expense_breakdown.payroll
                ],
                backgroundColor: [
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(153, 102, 255, 0.5)'
                ]
            }]
        };

        // Category-wise Expenses Chart
        const categoryData = {
            labels: data.category_expenses.map(cat => cat.category.name),
            datasets: [{
                label: 'Amount',
                data: data.category_expenses.map(cat => cat.total_amount),
                backgroundColor: 'rgba(54, 162, 235, 0.5)'
            }]
        };

        setChartData({ balanceData, expenseData, categoryData });
    };

    const handleDownload = async (reportType, format) => {
        try {
            setLoading(true);
            switch (reportType) {
                case 'fee-collections':
                    await reportService.getFeeCollectionReport({
                        ...filters,
                        format
                    });
                    break;
                case 'expenses':
                    await reportService.getExpenseReport({
                        ...filters,
                        format
                    });
                    break;
                case 'payroll':
                    await reportService.getPayrollReport({
                        ...filters,
                        format
                    });
                    break;
                case 'budget':
                    await reportService.getBudgetReport({
                        ...filters,
                        format
                    });
                    break;
                default:
                    break;
            }
            toast.success('Report downloaded successfully');
        } catch (error) {
            toast.error('Failed to download report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Financial Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Start Date
                        </label>
                        <input
                            type="date"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filters.start_date}
                            onChange={(e) => setFilters({
                                ...filters,
                                start_date: e.target.value
                            })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            End Date
                        </label>
                        <input
                            type="date"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filters.end_date}
                            onChange={(e) => setFilters({
                                ...filters,
                                end_date: e.target.value
                            })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Academic Year
                        </label>
                        <input
                            type="text"
                            placeholder="YYYY-YYYY"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filters.academic_year}
                            onChange={(e) => setFilters({
                                ...filters,
                                academic_year: e.target.value
                            })}
                        />
                    </div>
                </div>
            </div>

            {/* Report Types Tabs */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            className={`${
                                activeTab === 'summary'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            onClick={() => setActiveTab('summary')}
                        >
                            Financial Summary
                        </button>
                        <button
                            className={`${
                                activeTab === 'collections'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            onClick={() => setActiveTab('collections')}
                        >
                            Fee Collections
                        </button>
                        <button
                            className={`${
                                activeTab === 'expenses'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            onClick={() => setActiveTab('expenses')}
                        >
                            Expenses
                        </button>
                        <button
                            className={`${
                                activeTab === 'payroll'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            onClick={() => setActiveTab('payroll')}
                        >
                            Payroll
                        </button>
                        <button
                            className={`${
                                activeTab === 'budget'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            onClick={() => setActiveTab('budget')}
                        >
                            Budget
                        </button>
                    </nav>
                </div>
            </div>

            {/* Summary View */}
            {activeTab === 'summary' && summaryData && chartData && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-2">Total Income</h3>
                            <p className="text-3xl font-bold text-green-600">
                                {formatAmount(summaryData.total_income)}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-2">Total Expenses</h3>
                            <p className="text-3xl font-bold text-red-600">
                                {formatAmount(summaryData.total_expenses)}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-2">Net Balance</h3>
                            <p className={`text-3xl font-bold ${
                                summaryData.net_balance >= 0 ? 'text-blue-600' : 'text-red-600'
                            }`}>
                                {formatAmount(summaryData.net_balance)}
                            </p>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">Income vs Expenses</h3>
                            <Bar data={chartData.balanceData} />
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
                            <Pie data={chartData.expenseData} />
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow col-span-2">
                            <h3 className="text-lg font-semibold mb-4">Category-wise Expenses</h3>
                            <Bar data={chartData.categoryData} />
                        </div>
                    </div>
                </div>
            )}

            {/* Download Options */}
            <div className="mt-6 bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Download Reports</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span>Fee Collection Report</span>
                        <div className="space-x-2">
                            <button
                                onClick={() => handleDownload('fee-collections', 'excel')}
                                disabled={loading}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                            >
                                Excel
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Expense Report</span>
                        <div className="space-x-2">
                            <button
                                onClick={() => handleDownload('expenses', 'pdf')}
                                disabled={loading}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
                            >
                                PDF
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Payroll Report</span>
                        <div className="space-x-2">
                            <button
                                onClick={() => handleDownload('payroll', 'excel')}
                                disabled={loading}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                            >
                                Excel
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Budget Report</span>
                        <div className="space-x-2">
                            <button
                                onClick={() => handleDownload('budget', 'pdf')}
                                disabled={loading}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
                            >
                                PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsDashboard;
