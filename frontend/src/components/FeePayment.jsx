import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import invoiceService from '../services/invoiceService';
import { formatAmount, formatDate } from '../utils/academicUtils';

const FeePayment = ({ studentId }) => {
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentData, setPaymentData] = useState({
        amount: 0,
        payment_mode: 'CASH',
        payment_details: {},
        items: []
    });
    const [itemPayments, setItemPayments] = useState({});

    useEffect(() => {
        if (studentId) {
            fetchOutstandingInvoices();
        }
    }, [studentId]);

    const fetchOutstandingInvoices = async () => {
        try {
            setLoading(true);
            const response = await invoiceService.getOutstandingInvoices({ student_id: studentId });
            setInvoices(response.data);
        } catch (error) {
            toast.error('Failed to fetch outstanding invoices');
        } finally {
            setLoading(false);
        }
    };

    const handleInvoiceSelect = (invoice) => {
        setSelectedInvoice(invoice);
        // Initialize item payments with zero amounts
        const initialItemPayments = {};
        invoice.items.forEach(item => {
            initialItemPayments[item.id] = 0;
        });
        setItemPayments(initialItemPayments);
        setPaymentData({
            amount: 0,
            payment_mode: 'CASH',
            payment_details: {},
            items: []
        });
    };

    const handleItemPaymentChange = (itemId, amount) => {
        const newAmount = Math.min(
            parseFloat(amount) || 0,
            selectedInvoice.items.find(item => item.id === itemId).balance_amount
        );

        setItemPayments(prev => ({
            ...prev,
            [itemId]: newAmount
        }));

        // Update total payment amount
        const totalAmount = Object.values({
            ...itemPayments,
            [itemId]: newAmount
        }).reduce((sum, val) => sum + val, 0);

        setPaymentData(prev => ({
            ...prev,
            amount: totalAmount,
            items: Object.entries({
                ...itemPayments,
                [itemId]: newAmount
            }).map(([id, amount]) => ({
                invoice_item_id: parseInt(id),
                amount,
                sequence: selectedInvoice.items.findIndex(item => item.id === parseInt(id))
            })).filter(item => item.amount > 0)
        }));
    };

    const handlePaymentModeChange = (mode) => {
        setPaymentData(prev => ({
            ...prev,
            payment_mode: mode,
            payment_details: {} // Reset payment details when mode changes
        }));
    };

    const handlePaymentDetailsChange = (field, value) => {
        setPaymentData(prev => ({
            ...prev,
            payment_details: {
                ...prev.payment_details,
                [field]: value
            }
        }));
    };

    const handlePayment = async () => {
        try {
            if (!paymentData.amount) {
                toast.warning('Please enter payment amount');
                return;
            }

            if (paymentData.items.length === 0) {
                toast.warning('Please allocate payment to at least one fee item');
                return;
            }

            setLoading(true);
            await invoiceService.processPayment({
                invoice_id: selectedInvoice.id,
                ...paymentData
            });

            toast.success('Payment processed successfully');
            fetchOutstandingInvoices();
            setSelectedInvoice(null);
            setPaymentData({
                amount: 0,
                payment_mode: 'CASH',
                payment_details: {},
                items: []
            });
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Outstanding Invoices */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Outstanding Invoices</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Invoice #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Term
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Due Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Balance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className={selectedInvoice?.id === invoice.id ? 'bg-blue-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {invoice.invoice_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {invoice.term}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatDate(invoice.due_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatAmount(invoice.balance_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleInvoiceSelect(invoice)}
                                            className="text-blue-500 hover:text-blue-700"
                                        >
                                            Pay
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Form */}
            {selectedInvoice && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Process Payment</h3>

                    {/* Invoice Details */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <p className="text-sm text-gray-600">Invoice Number</p>
                            <p className="font-medium">{selectedInvoice.invoice_number}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Balance</p>
                            <p className="font-medium">{formatAmount(selectedInvoice.balance_amount)}</p>
                        </div>
                    </div>

                    {/* Fee Items */}
                    <div className="mb-6">
                        <h4 className="font-medium mb-2">Fee Items</h4>
                        <div className="space-y-4">
                            {selectedInvoice.items.map((item) => (
                                <div key={item.id} className="bg-gray-50 p-4 rounded">
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <p className="font-medium">{item.item_name}</p>
                                            <p className="text-sm text-gray-600">{item.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">Balance: {formatAmount(item.balance_amount)}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Payment Amount
                                        </label>
                                        <input
                                            type="number"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            value={itemPayments[item.id] || ''}
                                            onChange={(e) => handleItemPaymentChange(item.id, e.target.value)}
                                            min="0"
                                            max={item.balance_amount}
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="mb-6">
                        <h4 className="font-medium mb-2">Payment Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Payment Mode
                                </label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={paymentData.payment_mode}
                                    onChange={(e) => handlePaymentModeChange(e.target.value)}
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="CREDIT_CARD">Credit Card</option>
                                    <option value="DEBIT_CARD">Debit Card</option>
                                    <option value="UPI">UPI</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Total Amount
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                                    value={formatAmount(paymentData.amount)}
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* Additional fields based on payment mode */}
                        {paymentData.payment_mode === 'CHEQUE' && (
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Cheque Number
                                    </label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        onChange={(e) => handlePaymentDetailsChange('cheque_number', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Bank Name
                                    </label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        onChange={(e) => handlePaymentDetailsChange('bank_name', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {['BANK_TRANSFER', 'UPI'].includes(paymentData.payment_mode) && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Transaction ID
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    onChange={(e) => handlePaymentDetailsChange('transaction_id', e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {['CREDIT_CARD', 'DEBIT_CARD'].includes(paymentData.payment_mode) && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Card Last 4 Digits
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    maxLength="4"
                                    pattern="\d{4}"
                                    onChange={(e) => handlePaymentDetailsChange('card_last_digits', e.target.value)}
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4">
                        <button
                            onClick={() => setSelectedInvoice(null)}
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
            )}
        </div>
    );
};

export default FeePayment;
