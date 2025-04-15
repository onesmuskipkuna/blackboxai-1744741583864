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
    ArcElement,
    PointElement,
    LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import invoiceService from '../services/invoiceService';
import { formatAmount, formatDate } from '../utils/academicUtils';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

const PaymentDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [filters, setFilters] = useState({
        start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        payment_mode: ''
    });
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, [filters]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsResponse, collectionResponse] = await Promise.all([
                invoiceService.getStatistics(filters),
                invoiceService.getCollectionReport(filters)
            ]);

            setStats(statsResponse.data);
            prepareChartData(statsResponse.data, collectionResponse.data);
        } catch (error) {
            toast.error('Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const prepareChartData = (stats, collections) => {
        // Payment mode distribution chart
        const modeData = {
            labels: Object.keys(stats.by_mode).map(mode => mode.replace('_', ' ')),
            datasets: [{
                data: Object.values(stats.by_mode),
                backgroundColor: [
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                    'rgba(255, 99, 132, 0.5)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        };

        // Daily collections trend
        const trendData = {
            labels: collections.daily.map(item => formatDate(item.date)),
            datasets: [{
                label: 'Daily Collections',
                data: collections.daily.map(item => item.amount),
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1,
                fill: false
            }]
        };

        // Status distribution chart
        const statusData = {
            labels: Object.keys(stats.by_status).map(status => status.replace('_', ' ')),
            datasets: [{
                data: Object.values(stats.by_status),
                backgroundColor: [
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(153, 102, 255, 0.5)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        };

        setChartData({ modeData, trendData, statusData });
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
                    alt="Payment Dashboard Banner"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h2 className="text-2xl font-bold">Payment Dashboard</h2>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Start Date
                        </label>
                        <input
                            type="date"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filters.start_date}
                            onChange={(e) => setFilters({...filters, start_date: e.target.value})}
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
                            onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Payment Mode
                        </label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filters.payment_mode}
                            onChange={(e) => setFilters({...filters, payment_mode: e.target.value})}
                        >
                            <option value="">All Modes</option>
                            <option value="CASH">Cash</option>
                            <option value="CHEQUE">Cheque</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="CREDIT_CARD">Credit Card</option>
                            <option value="DEBIT_CARD">Debit Card</option>
                            <option value="UPI">UPI</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Total Collections</h3>
                    <p className="text-3xl font-bold text-blue-600">
                        {formatAmount(stats.total_collections)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Today's Collections</h3>
                    <p className="text-3xl font-bold text-green-600">
                        {formatAmount(stats.today_collections)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Outstanding Amount</h3>
                    <p className="text-3xl font-bold text-red-600">
                        {formatAmount(stats.total_outstanding)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Total Transactions</h3>
                    <p className="text-3xl font-bold text-purple-600">
                        {stats.total_transactions}
                    </p>
                </div>
            </div>

            {/* Charts */}
            {chartData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payment Mode Distribution */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Payment Mode Distribution</h3>
                        <Pie
                            data={chartData.modeData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'bottom'
                                    }
                                }
                            }}
                        />
                    </div>

                    {/* Daily Collections Trend */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Collections Trend</h3>
                        <Line
                            data={chartData.trendData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        display: false
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                }
                            }}
                        />
                    </div>

                    {/* Payment Status Distribution */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Payment Status Distribution</h3>
                        <Pie
                            data={chartData.statusData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'bottom'
                                    }
                                }
                            }}
                        />
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Receipt</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recent_transactions?.map((transaction) => (
                                        <tr key={transaction.id} className="border-b">
                                            <td className="px-4 py-2">{formatDate(transaction.payment_date)}</td>
                                            <td className="px-4 py-2">{transaction.receipt_number}</td>
                                            <td className="px-4 py-2 text-right">{formatAmount(transaction.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentDashboard;
