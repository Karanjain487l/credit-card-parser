import React, { useState, useMemo } from 'react';

// Data and icons (moved from App.js for cleanliness)
const dataLabels = { totalBalance: "Total Amount Due", dueDate: "Payment Due Date", statementDate: "Statement Date", last4Digits: "Last 4 Digits", minPayment: "Minimum Due", purchasesDebit: "Purchases/Debit", paymentsCredits: "Payments/Credits", totalCreditLimit: "Total Credit Limit", availableCreditLimit: "Available Credit Limit", availableCashLimit: "Available Cash Limit", previousStatementDues: "Previous Statement Dues" };
const primaryKeys = ['totalBalance', 'dueDate', 'statementDate', 'last4Digits', 'minPayment'];
const icons = {
    totalBalance: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    dueDate: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    statementDate: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    last4Digits: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
    minPayment: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8h6m-5 4h5m2 5H8a2 2 0 01-2-2V7a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H8z" /></svg>
};

const SummaryTab = ({ data }) => {
    const [selectedDetail, setSelectedDetail] = useState('');

    const additionalKeys = useMemo(() => {
        return Object.keys(data)
            .filter(key => !primaryKeys.includes(key) && key !== 'transactions' && key !== 'categories' && data[key] && data[key] !== 'Not Found')
            .map(key => ({ key, label: dataLabels[key] || key }));
    }, [data]);

    useState(() => {
        if (additionalKeys.length > 0) {
            setSelectedDetail(additionalKeys[0].key);
        }
    }, [additionalKeys]);

    const exportSummaryToCSV = () => {
        const headers = ["Field", "Value"];
        const summaryKeys = Object.keys(dataLabels);
        const rows = summaryKeys.map(key => {
            if (data[key] && data[key] !== 'Not Found') {
                return [dataLabels[key], `"${data[key]}"`];
            }
            return null;
        }).filter(Boolean);
        
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "statement_summary.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center pb-4 mb-6 gap-3">
                <h2 className="text-2xl font-semibold text-gray-800">Statement Summary</h2>
                <button 
                    onClick={exportSummaryToCSV}
                    className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm shadow-md hover:shadow-lg transition-all duration-300"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block -mt-1 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    Export Summary
                </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {primaryKeys.map(key => (
                    data[key] && data[key] !== 'Not Found' && (
                        <div key={key} className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-start space-x-4">
                            <div className="bg-indigo-100 text-indigo-600 rounded-full p-3">{icons[key] || ''}</div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">{dataLabels[key]}</p>
                                <p className="text-xl font-bold text-gray-800">{data[key]}</p>
                            </div>
                        </div>
                    )
                ))}
            </div>

            {additionalKeys.length > 0 && (
                <div id="additional-data-container">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 pt-6 border-t border-gray-200">Additional Details</h3>
                    <div className="space-y-4">
                        <div className="w-full">
                            <label htmlFor="data-selector" className="block text-sm font-medium text-gray-700 mb-1">Select data to view:</label>
                            <select 
                                id="data-selector" 
                                name="data-selector" 
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                value={selectedDetail}
                                onChange={e => setSelectedDetail(e.target.value)}
                            >
                                {additionalKeys.map(item => (
                                    <option key={item.key} value={item.key}>{item.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-lg">
                            <span className="font-medium text-indigo-800">{dataLabels[selectedDetail] || selectedDetail}:</span>
                            <span className="font-bold text-xl text-gray-800">{data[selectedDetail] || 'Not Found'}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SummaryTab;