// client/src/App.js
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import Loader from './components/Loader';
import SummaryTab from './components/SummaryTab';
import TransactionsTab from './components/TransactionsTab';
import ChartTab from './components/ChartTab';

import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url'; 
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const API_URL = 'http://localhost:5000/api/parse-statement';

function App() {
    const [currentFile, setCurrentFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loaderText, setLoaderText] = useState('');
    const [error, setError] = useState(null);
    const [password, setPassword] = useState('');
    const [isPasswordProtected, setIsPasswordProtected] = useState(false);
    
    const [extractedData, setExtractedData] = useState(null);
    const [activeTab, setActiveTab] = useState('summary');

    const resetUI = () => {
        setIsLoading(false);
        setError(null);
        setExtractedData(null);
        setCurrentFile(null);
        setFileName('');
        setIsPasswordProtected(false);
        setPassword('');
        setActiveTab('summary');
    };

    const checkPdfPassword = async (file, userPassword = '') => {
        const arrayBuffer = await file.arrayBuffer();
        try {
            const pdf = await pdfjsLib.getDocument({
                data: arrayBuffer,
                password: userPassword,
            }).promise;
            
            pdf.destroy(); 
            return true; 

        } catch (error) {
            if (error.name === 'PasswordException') {
                return false;
            }
            throw new Error('Could not read the PDF file.'); 
        }
    };

    const uploadFile = async (file, userPassword = '') => {
        setIsLoading(true);
        setLoaderText('Parsing PDF and analyzing data...');
        setError(null); 
        setIsPasswordProtected(false);

        const formData = new FormData();
        formData.append('pdf', file);
        if (userPassword) {
            formData.append('password', userPassword);
        }

        try {
            const response = await axios.post(API_URL, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setExtractedData(response.data);
            setIsLoading(false);

        } catch (err) {
            setIsLoading(false);
            console.error('API Error:', err);
            setError(err.response?.data?.error || 'An unknown server error occurred.');
        }
    };
    
    const handleFileSelect = async (file) => {
        if (!file || file.type !== 'application/pdf') {
            setError('Please select a valid PDF file.');
            return;
        }

        resetUI();
        setCurrentFile(file); 
        setFileName(file.name);
        setIsLoading(true);
        setLoaderText('Checking PDF metadata...');

        try {
            const isUnlocked = await checkPdfPassword(file);
            if (isUnlocked) {                
                await uploadFile(file);
            } else {                
                setIsLoading(false);
                setIsPasswordProtected(true);
                setError('This PDF is password-protected. Please enter the password:');
            }
        } catch (err) {
            setIsLoading(false);
            setError(err.message);
        }
    };
        
    const onFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };
 
    const handlePasswordFormSubmit = async (e) => {
        e.preventDefault();
        if (!currentFile || !password) {
            setError('Please enter a password.');
            return;
        }

        setIsLoading(true);
        setLoaderText('Checking password...');
        setError(null);

        try {
            const isUnlocked = await checkPdfPassword(currentFile, password);
            if (isUnlocked) {               
                await uploadFile(currentFile, password);
            } else {                
                setIsLoading(false);
                setError('Incorrect password. Please try again.');
            }
        } catch (err) {
            setIsLoading(false);
            setError(err.message);
        }
    };

    
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-50');
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50');
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50');
        
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file); 
        } else {
            setError('Please select a valid PDF file.');
        }
    }, []); 

    const hasTransactions = extractedData?.transactions && extractedData.transactions.length > 0;
    const hasChartData = hasTransactions && extractedData?.categories && extractedData.categories.length > 0;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-4xl mx-auto">
                <div className="glass-card rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <div className="inline-block bg-indigo-600 text-white rounded-full p-3 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800">Credit Card Statement Parser</h1>
                        <p className="text-gray-500 mt-2">Instantly extract key data from your PDF statements.</p>
                    </div>

                    
                    {!extractedData && !isLoading && !isPasswordProtected && (
                        <div 
                            id="upload-container" 
                            className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300"
                            onClick={() => document.getElementById('pdf-upload').click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input type="file" id="pdf-upload" className="hidden" accept=".pdf" onChange={onFileChange} />
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <p className="mt-2 text-sm text-gray-600"><span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-500 mt-1">PDF only</p>
                        </div>
                    )}
                    
                    {fileName && <div className="mt-4 text-center"><p className="text-gray-700 font-medium">File: <span>{fileName}</span></p></div>}

                    
                    {isPasswordProtected && !isLoading && (
                        <form onSubmit={handlePasswordFormSubmit} className="my-6 text-center">
                            <input 
                                type="password" 
                                className="w-full max-w-xs mx-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button type="submit" className="mt-3 w-full max-w-xs mx-auto bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300">
                                Submit Password
                            </button>
                        </form>
                    )}

                    {isLoading && <Loader text={loaderText} />}

                    
                    {error && (
                        <div className="mt-6 text-center text-red-600 font-medium bg-red-100 p-3 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    
                    {extractedData && (
                        <div id="results-container" className="mt-8">
                            {/* Tab Navigation */}
                            <div className="border-b border-gray-200">
                                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                                    <button onClick={() => setActiveTab('summary')} className={`tab-button whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'summary' ? 'active' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                        Summary
                                    </button>
                                    <button onClick={() => setActiveTab('chart')} disabled={!hasChartData} className={`tab-button whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'chart' ? 'active' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                        Spending Chart
                                    </button>
                                    <button onClick={() => setActiveTab('transactions')} disabled={!hasTransactions} className={`tab-button whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'transactions' ? 'active' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                        Transactions
                                    </button>
                                </nav>
                            </div>
                            
                            {activeTab === 'summary' && <SummaryTab data={extractedData} />}
                            {activeTab === 'chart' && <ChartTab transactions={extractedData.transactions} categories={extractedData.categories} />}
                            {activeTab === 'transactions' && <TransactionsTab transactions={extractedData.transactions} />}
                        </div>
                    )}
                </div>
                
                <footer className="text-center mt-6">
                    <p className="text-xs text-gray-500">Disclaimer: This tool is for demonstration purposes. Accuracy depends on the PDF statement's format. Always verify extracted data with the original document.</p>
                </footer>
            </div>
        </div>
    );
}

export default App;