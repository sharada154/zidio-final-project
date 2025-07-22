import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { FiUploadCloud, FiFileText, FiXCircle, FiCheckCircle } from 'react-icons/fi';
import { selectCurrentToken } from '../store/authSlice';
import { useSelector } from 'react-redux';
import SendRequest from '../api/SendRequest';
import { motion } from 'framer-motion';

const DEV_MODE = false;
const DEV_MODE_UPLOAD_DELAY = 1500;
const DEV_MODE_PROGRESS_INTERVAL = 100;
const PREVIEW_ROW_COUNT = 5;

export default function Upload() {
    const navigate = useNavigate();
    const token = useSelector(selectCurrentToken);
    const [file, setFile] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [previewData, setPreviewData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isTokenValid, setIsTokenValid] = useState(DEV_MODE);

    useEffect(() => {
        if (!DEV_MODE) {
            const verifyToken = async () => {
                try {
                    const data = await SendRequest(token);
                    setIsTokenValid(true);
                } catch (error) {
                    setIsTokenValid(false);
                    toast.error('Session expired. Please login again.');
                }
            };
            verifyToken();
        }
    }, [token]);

    const onDrop = useCallback((acceptedFiles) => {
        if (!isTokenValid) {
            toast.error('Please login to upload files');
            return;
        }

        if (acceptedFiles.length === 0) return;

        const selectedFile = acceptedFiles[0];

        if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'].includes(selectedFile.type)) {
            toast.error('Please upload an Excel file (.xlsx or .xls)');
            return;
        }

        setFile(selectedFile);

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            if (jsonData.length > 0) {
                setHeaders(jsonData[0]);
                setPreviewData(jsonData.slice(1, PREVIEW_ROW_COUNT + 1));
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    }, [isTokenValid]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        maxFiles: 1
    });

    const removeFile = () => {
        setFile(null);
        setHeaders([]);
        setPreviewData([]);
    };

    const simulateUpload = () => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    setIsLoading(false);
                    setUploadProgress(0);

                    const visualizationData = {
                        headers: headers,
                        data: previewData.map(row => {
                            const obj = {};
                            headers.forEach((header, i) => {
                                obj[header] = row[i];
                            });
                            return obj;
                        })
                    };

                    navigate('/visualize', { state: { uploadedData: visualizationData } });
                }, 300);
            }
            setUploadProgress(progress);
        }, 100);
    };

    const handleUpload = async () => {
        if (!isTokenValid) {
            toast.error('Session expired. Please login again.');
            return;
        }

        if (!file) {
            toast.error('Please select a file first');
            return;
        }

        setIsLoading(true);
        setUploadProgress(0);

        if (DEV_MODE) {
            simulateUpload();
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('https://sageexcelbackend-production.up.railway.app/api/auth/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('File uploaded successfully!');
                setFile(null);
                setHeaders([]);
                setPreviewData([]);
            } else {
                toast.error(data.message || 'File upload failed');
            }
        } catch (error) {
            toast.error('An error occurred during upload');
        } finally {
            setIsLoading(false);
        }
    };

    if (!DEV_MODE && !isTokenValid) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Authentication Required
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Please login to access the upload feature.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-r from-indigo-50 via-white to-indigo-100 flex items-center justify-center p-6">
            <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl p-8">
                <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-10">
                    {/* <h1 className="text-4xl font-extrabold text-indigo-600">Excel Analytics Platform</h1> */}
                    <p className="mt-3 text-gray-600 text-lg">Upload your Excel sheet and let us crunch the numbers.</p>
                    {DEV_MODE && (
                        <div className="mt-3 inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">Development Mode Active</div>
                    )}
                </motion.div>

                <motion.div {...getRootProps()} className={`border-4 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`} whileHover={{ scale: 1.02 }}>
                    <input {...getInputProps()} />
                    <FiUploadCloud className="mx-auto text-indigo-400 w-12 h-12" />
                    <p className="mt-4 text-gray-700 text-lg font-medium">{isDragActive ? 'Drop it here!' : 'Drag and drop an Excel file or click to upload'}</p>
                    <p className="text-sm text-gray-400 mt-1">Accepted: .xlsx, .xls</p>
                </motion.div>

                {file && (
                    <motion.div className="mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <FiFileText className="text-indigo-500 w-5 h-5" />
                                <span className="text-indigo-700 font-semibold">{file.name}</span>
                            </div>
                            <button onClick={removeFile}><FiXCircle className="text-red-500 hover:text-red-600 w-5 h-5" /></button>
                        </div>

                        <div className="mt-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Column Headers</h3>
                            <div className="flex flex-wrap gap-2">
                                {headers.map((header, idx) => (
                                    <span key={idx} className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full">{header}</span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Preview</h3>
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-indigo-100">
                                        <tr>
                                            {headers.map((header, idx) => (
                                                <th key={idx} className="px-4 py-2 text-xs text-left text-gray-700 uppercase">{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {previewData.map((row, i) => (
                                            <tr key={i}>
                                                {row.map((cell, j) => (
                                                    <td key={j} className="px-4 py-2 text-sm text-gray-700">{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Showing first {Math.min(previewData.length, PREVIEW_ROW_COUNT)} rows of data</p>
                        </div>

                        {isLoading && (
                            <div className="pt-2">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Progress</span>
                                    <span className="font-medium">{Math.round(uploadProgress)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={isLoading || !file}
                            className={`w-full mt-4 flex justify-center items-center py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none ${isLoading || !file ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {DEV_MODE ? 'Simulating Upload...' : 'Uploading...'}
                                </>
                            ) : (
                                <>
                                    <FiCheckCircle className="mr-2 h-5 w-5" />
                                    {DEV_MODE ? 'Simulate Upload' : 'Upload File'}
                                </>
                            )}
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
