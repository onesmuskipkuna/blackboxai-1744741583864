import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import invoiceService from '../services/invoiceService';
import { formatAmount, formatDate } from '../utils/academicUtils';

const InvoiceManager = () => {
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [filters, setFilters] = useState({
        student_id: '',
        academic_year: '',
        term: '',
        status: ''
    });
    const [paymentData, setPaymentData] = useState({
        amount: 0,
        payment_mode: 'CASH',
        payment_details: {},
        items: []
    });

    useEffect(() => {
        fetchInvoices();
    }, [filters]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await invoiceService.getOutstandingInvoices(filters);
            setInvoices(response.data);
        } catch (error) {
            toast.error('Failed to fetch invoices');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        try {
            setLoading(true);
            await invoiceService.processPayment({
                invoice_id: selectedInvoice.id,
                ...paymentData
            });
            toast.success('Payment processed successfully');
            setShowPaymentModal(false);
            fetchInvoices();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelInvoice = async (invoiceId) => {
        if (!window.confirm('Are you sure you want to cancel this invoice?')) return;

        try {
            setLoading(true);
            await invoiceService.cancelInvoice(invoiceId, 'Cancelled by user');
            toast.success('Invoice cancelled successfully');
            fetchInvoices();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadReceipt = async (paymentId) => {
        try {
            const blob = await invoiceService.downloadReceipt(paymentId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt-${paymentId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download receipt');
        }
    };

    return (
        <div className="p-6">
            {/* Header with Banner */}
            <div className="mb-8">
                <img 
                    src="https://images.pexels.com/photos/3183183/pexels-photo-3183183.jpeg"
                    alt="Invoice Management Banner"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h2 className="text-2xl font-bold">Invoice Management</h2>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Student ID
                        </label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filters.student_id}
                            onChange={(e) => setFilters({...filters, student_id: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Academic Year
                        </label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="YYYY-YYYY"
                            value={filters.academic_year}
                            onChange={(e) => setFilters({...filters, academic_year: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Term
                        </label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filters.term}
                            onChange={(e) => setFilters({...filters, term: e.target.value})}
                        >
                            <option value="">All Terms</option>
                            <option value="TERM_1">Term 1</option>
                            <option value="TERM_2">Term 2</option>
                            <option value="TERM_3">Term 3</option>
                        </select>
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
                            <option value="">All Statuses</option>
                            <option value="UNPAID">Unpaid</option>
                            <option value="PARTIALLY_PAID">Partially Paid</option>
                            <option value="PAID">Paid</option>
                            <option value="OVERDUE">Overdue</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Invoices List */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Invoice #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Term
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Balance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Due Date
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
                            {invoices.map((invoice) => (
                                <tr key={invoice.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {invoice.invoice_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {invoice.student.first_name} {invoice.student.last_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {invoice.term}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatAmount(invoice.total_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatAmount(invoice.balance_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatDate(invoice.due_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full
                                            ${invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                              invoice.status === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-800' :
                                              invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                                              'bg-gray-100 text-gray-800'}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => {
                                                setSelectedInvoice(invoice);
                                                setShowPaymentModal(true);
                                            }}
                                            className="text-blue-500 hover:text-blue-700 mr-2"
                                            disabled={invoice.status === 'PAID' || invoice.status === 'CANCELLED'}
                                        >
                                            Pay
                                        </button>
                                        <button
                                            onClick={() => handleCancelInvoice(invoice.id)}
                                            className="text-red-500 hover:text-red-700"
                                            disabled={invoice.status === 'PAID' || invoice.status === 'CANCELLED'}
                                        >
                                            Cancel
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedInvoice && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
                        <h3 className="text-lg font-semibold mb-4">Process Payment</h3>
                        
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Invoice #: {selectedInvoice.invoice_number}
                            </p>
                            <p className="text-sm text-gray-600">
                                Balance: {formatAmount(selectedInvoice.balance_amount)}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Payment Amount
                                </label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={paymentData.amount}
                                    onChange={(e) => setPaymentData({
                                        ...paymentData,
                                        amount: parseFloat(e.target.value)
                                    })}
                                    max={selectedInvoice.balance_amount}
                                    min={0}
                                    step="0.01"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Payment Mode
                                </label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={paymentData.payment_mode}
                                    onChange={(e) => setPaymentData({
                                        ...paymentData,
                                        payment_mode: e.target.value
                                    })}
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="CREDIT_CARD">Credit Card</option>
                                    <option value="DEBIT_CARD">Debit Card</option>
                                    <option value="UPI">UPI</option>
                                </select>
                            </div>

                            {/* Additional fields based on payment mode */}
                            {paymentData.payment_mode === 'CHEQUE' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Cheque Number
                                        </label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            onChange={(e) => setPaymentData({
                                                ...paymentData,
                                                payment_details: {
                                                    ...paymentData.payment_details,
                                                    cheque_number: e.target.value
                                                }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Bank Name
                                        </label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            onChange={(e) => setPaymentData({
                                                ...paymentData,
                                                payment_details: {
                                                    ...paymentData.payment_details,
                                                    bank_name: e.target.value
                                                }
                                            })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePayment}
                                    disabled={loading || !paymentData.amount}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                                >
                                    {loading ? 'Processing...' : 'Process Payment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceManager;
