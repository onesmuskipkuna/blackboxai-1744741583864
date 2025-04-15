import React, { useState } from 'react';
import { toast } from 'react-toastify';
import feeStructureService from '../services/feeStructureService';

const FeeStructureImportExport = () => {
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [importResults, setImportResults] = useState(null);
    const [selectedStructure, setSelectedStructure] = useState(null);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            setSelectedFile(file);
        } else {
            toast.error('Please select a valid Excel file (.xlsx)');
            event.target.value = null;
        }
    };

    const handleImport = async () => {
        if (!selectedFile) {
            toast.warning('Please select a file to import');
            return;
        }

        try {
            setImporting(true);
            const result = await feeStructureService.importFromExcel(selectedFile);
            setImportResults(result.data);
            toast.success('Fee structure imported successfully');
        } catch (error) {
            toast.error('Failed to import fee structure');
        } finally {
            setImporting(false);
            setSelectedFile(null);
            // Reset file input
            document.getElementById('fileInput').value = '';
        }
    };

    const handleExport = async (structureId) => {
        try {
            setExporting(true);
            const blob = await feeStructureService.exportToExcel(structureId);
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `fee-structure-${structureId}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Fee structure exported successfully');
        } catch (error) {
            toast.error('Failed to export fee structure');
        } finally {
            setExporting(false);
        }
    };

    const downloadTemplate = async () => {
        try {
            const response = await feeStructureService.getTemplate();
            
            // Create download link for template
            const url = window.URL.createObjectURL(response);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'fee-structure-template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Template downloaded successfully');
        } catch (error) {
            toast.error('Failed to download template');
        }
    };

    return (
        <div className="p-6">
            {/* Header with Banner */}
            <div className="mb-8">
                <img 
                    src="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg"
                    alt="Import Export Banner"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h2 className="text-2xl font-bold">Fee Structure Import/Export</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Import Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Import Fee Structure</h3>
                    
                    <div className="mb-4">
                        <button
                            onClick={downloadTemplate}
                            className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                            Download Import Template
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Excel File
                            </label>
                            <input
                                id="fileInput"
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileSelect}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-50 file:text-blue-700
                                    hover:file:bg-blue-100"
                            />
                        </div>

                        <button
                            onClick={handleImport}
                            disabled={!selectedFile || importing}
                            className={`w-full px-4 py-2 rounded-md text-white
                                ${!selectedFile || importing
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-500 hover:bg-blue-600'}`}
                        >
                            {importing ? 'Importing...' : 'Import'}
                        </button>
                    </div>

                    {/* Import Results */}
                    {importResults && (
                        <div className="mt-6">
                            <h4 className="font-medium mb-2">Import Results</h4>
                            <div className="bg-gray-50 p-4 rounded">
                                <p>Successfully imported: {importResults.success} items</p>
                                {importResults.errors.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-red-600">Errors:</p>
                                        <ul className="list-disc list-inside text-sm">
                                            {importResults.errors.map((error, index) => (
                                                <li key={index} className="text-red-600">
                                                    {error}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Export Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Export Fee Structure</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Fee Structure
                            </label>
                            <select
                                value={selectedStructure || ''}
                                onChange={(e) => setSelectedStructure(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="">Select a fee structure...</option>
                                {/* Options will be populated from props or context */}
                            </select>
                        </div>

                        <button
                            onClick={() => handleExport(selectedStructure)}
                            disabled={!selectedStructure || exporting}
                            className={`w-full px-4 py-2 rounded-md text-white
                                ${!selectedStructure || exporting
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-500 hover:bg-green-600'}`}
                        >
                            {exporting ? 'Exporting...' : 'Export'}
                        </button>
                    </div>

                    <div className="mt-6">
                        <h4 className="font-medium mb-2">Export Format</h4>
                        <div className="bg-gray-50 p-4 rounded text-sm">
                            <p>The exported Excel file will include:</p>
                            <ul className="list-disc list-inside mt-2">
                                <li>Fee structure details</li>
                                <li>All fee items with categories</li>
                                <li>Payment schedules</li>
                                <li>Term-wise breakdown</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Instructions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium mb-2">Import Guidelines</h4>
                        <ul className="list-disc list-inside text-sm space-y-2">
                            <li>Use the provided template for importing</li>
                            <li>Ensure all mandatory fields are filled</li>
                            <li>Amount should be in numbers only</li>
                            <li>Categories must match system categories</li>
                            <li>Each fee item should have a unique name</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-medium mb-2">Export Information</h4>
                        <ul className="list-disc list-inside text-sm space-y-2">
                            <li>Exports are in Excel (.xlsx) format</li>
                            <li>All fee items will be included</li>
                            <li>Categories will be preserved</li>
                            <li>Payment schedules will be included</li>
                            <li>Historical data is not included</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeStructureImportExport;
