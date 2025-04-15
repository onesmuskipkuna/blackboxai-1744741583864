import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import invoiceService from '../services/invoiceService';
import { formatAmount, formatDate } from '../utils/academicUtils';

const PaymentHistory = ({ studentId }) => {
    const [loading, setLoading] = useState(false);
    const [payments, setPayments] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        status: ''
    });

    useEffect(() => {
        if (studentId) {
            fetchPayments();
        }
    }, [studentId, filters]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await invoiceService.getStudentPayments(studentId, filters);
            setPayments(response.data);
        } catch (error) {
            toast.error('Failed to fetch payment history');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReceipt = async (paymentId) => {
        try {
            const blob = await invoiceService.downloadReceipt(paymentId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt-${paymentId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Failed to download receipt');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            case 'REFUNDED':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
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
                            Status
                        </label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value})}
                        >
                            <option value="">All</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="PENDING">Pending</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="REFUNDED">Refunded</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Payments List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Receipt #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mode
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {payment.receipt_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatDate(payment.payment_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatAmount(payment.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {payment.payment_mode.replace('_', ' ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => {
                                                setSelectedPayment(payment);
                                                setShowDetailsModal(true);
                                            }}
                                            className="text-blue-500 hover:text-blue-700 mr-3"
                                        >
                                            Details
                                        </button>
                                        {payment.status === 'COMPLETED' && (
                                            <button
                                                onClick={() => handleDownloadReceipt(payment.id)}
                                                className="text-green-500 hover:text-green-700"
                                            >
                                                Receipt
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Details Modal */}
            {showDetailsModal && selectedPayment && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
                        <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-gray-600">Receipt Number</p>
                                <p className="font-medium">{selectedPayment.receipt_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Payment Date</p>
                                <p className="font-medium">{formatDate(selectedPayment.payment_date)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Amount</p>
                                <p className="font-medium">{formatAmount(selectedPayment.amount)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Payment Mode</p>
                                <p className="font-medium">{selectedPayment.payment_mode.replace('_', ' ')}</p>
                            </div>
                        </div>

                        {/* Payment Items */}
                        <div className="mb-6">
                            <h4 className="font-medium mb-2">Payment Breakdown</h4>
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                            Fee Item
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedPayment.items?.map((item) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="px-4 py-2">
                                                {item.invoiceItem.item_name}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {formatAmount(item.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Payment Details */}
                        {selectedPayment.payment_mode !== 'CASH' && (
                            <div className="mb-6">
                                <h4 className="font-medium mb-2">Transaction Details</h4>
                                <div className="bg-gray-50 p-4 rounded">
                                    {selectedPayment.payment_mode === 'CHEQUE' && (
                                        <>
                                            <p><span className="text-gray-600">Cheque Number:</span> {selectedPayment.cheque_number}</p>
                                            <p><span className="text-gray-600">Bank:</span> {selectedPayment.bank_name}</p>
                                        </>
                                    )}
                                    {selectedPayment.payment_mode === 'BANK_TRANSFER' && (
                                        <p><span className="text-gray-600">Transaction ID:</span> {selectedPayment.transaction_id}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentHistory;
