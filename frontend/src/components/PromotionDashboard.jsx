import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
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
import promotionService from '../services/promotionService';
import { formatAmount, formatDate, getCurrentTerm } from '../utils/academicUtils';

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

const PromotionDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, [dateRange]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsResponse, reportResponse] = await Promise.all([
                promotionService.getPromotionStatistics(dateRange),
                promotionService.getPromotionReport(dateRange)
            ]);

            setStats(statsResponse.data);
            prepareChartData(statsResponse.data, reportResponse.data);
        } catch (error) {
            toast.error('Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const prepareChartData = (stats, report) => {
        // Prepare data for class-wise promotions bar chart
        const classData = {
            labels: Object.keys(stats.byClass),
            datasets: [{
                label: 'Number of Promotions',
                data: Object.values(stats.byClass),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        };

        // Prepare data for balance transfer pie chart
        const balanceData = {
            labels: ['Transferred', 'Outstanding'],
            datasets: [{
                data: [
                    stats.totalBalanceTransferred,
                    stats.totalOutstandingBalance
                ],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(255, 99, 132, 0.5)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        };

        setChartData({ classData, balanceData });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header with Banner */}
            <div className="mb-8">
                <img 
                    src="https://images.pexels.com/photos/3183183/pexels-photo-3183183.jpeg"
                    alt="Dashboard Banner"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h2 className="text-2xl font-bold">Promotion Dashboard</h2>
            </div>

            {/* Date Range Filter */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({
                                ...dateRange,
                                startDate: e.target.value
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({
                                ...dateRange,
                                endDate: e.target.value
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Total Promotions</h3>
                    <p className="text-3xl font-bold text-blue-600">
                        {stats.totalPromotions}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Balance Transferred</h3>
                    <p className="text-3xl font-bold text-green-600">
                        {formatAmount(stats.totalBalanceTransferred)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Outstanding Balance</h3>
                    <p className="text-3xl font-bold text-red-600">
                        {formatAmount(stats.totalOutstandingBalance)}
                    </p>
                </div>
            </div>

            {/* Charts */}
            {chartData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Class-wise Promotions Chart */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">
                            Class-wise Promotions
                        </h3>
                        <Bar
                            data={chartData.classData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                    },
                                    title: {
                                        display: false
                                    }
                                }
                            }}
                        />
                    </div>

                    {/* Balance Transfer Chart */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">
                            Balance Distribution
                        </h3>
                        <Pie
                            data={chartData.balanceData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Recent Promotions Table */}
            <div className="mt-6 bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Recent Promotions</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    From Class
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    To Class
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Balance Transferred
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stats.recentPromotions?.map((promotion) => (
                                <tr key={promotion.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {promotion.student.first_name} {promotion.student.last_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {promotion.from_class}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {promotion.to_class}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatAmount(promotion.balance_transferred)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatDate(promotion.promotion_date)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PromotionDashboard;
