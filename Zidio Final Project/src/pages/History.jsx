import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectCurrentToken } from '../store/authSlice';
import { useSelector } from 'react-redux';
import SendRequest from '../../src/api/SendRequest';
import { FiDownload, FiTrash2, FiEye, FiClock, FiFile, FiFileText } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import * as XLSX from "xlsx";
import { motion } from "framer-motion";

// Development mode flag - set to false when deploying to production
const DEV_MODE = false;

export default function History() {
    const navigate = useNavigate();
    const token = useSelector(selectCurrentToken);
    const [uploads, setUploads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(false); // Bypass auth in dev mode



    useEffect(() => {
        const fetchData = async () => {
            try {
                    setIsLoading(true);
                    const response = await fetch('https://sageexcelbackend-production.up.railway.app/api/auth/getFiles', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const data = await response.json();
                    if (response.ok) {
                        const user = data.user;
                        const files = user.uploadedFiles;
                        setUploads(files);
                        setIsLoading(false)
                        setIsTokenValid(true); // Set token valid if response is ok
                    }
                }
                catch (error) {
                    console.error('Error:', error);
                    toast.error(DEV_MODE ? 'Mock error simulation' : error.message || 'Failed to load history');
                    setIsLoading(false);
            }
        };

        fetchData();
    }, [token]);

    //method for handling downlaod
    const handleDownload = async (fileId, fileName) => {
        // if (DEV_MODE) {
        //     // DEVELOPMENT: Simulate download
        //     toast.success(`[DEV] Would download file ${fileId}`);
        //     console.log('Would download file:', fileId);
        //     return;
        // }


        try {
            const response = await fetch(`https://sageexcelbackend-production.up.railway.app/api/auth/download/${fileId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('File download Failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || 'download'
            document.body.appendChild(a);
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            toast.error('Download Failed')
        }

    };

    //method for handling delete of the file
    const handleDelete = async (fileId) => {
        if (DEV_MODE) {
            // DEVELOPMENT: Simulate deletion
            setUploads(uploads.filter(upload => upload.id !== fileId));
            toast.success('[DEV] File deleted (simulated)');
            console.log('Would delete file:', fileId);
            return;
        }



        try {
            const response = await fetch(`https://sageexcelbackend-production.up.railway.app/api/auth/delete/${fileId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });
            const data = await response.json();

            if (response.ok) {
                toast.success('file Deleted');
                setUploads((prev) => prev.filter((file) => file._id !== fileId));
            } else {
                toast.error(data.message || 'deletion failed');
            }
        } catch (error) {
            toast.error('An error occurred while deleting');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    //method for handling veiw
    const handleView = async (fileId) => {
        navigate('/visualize', { state: { id: fileId, token: token } });
    }

    // Loading and Auth logic
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Loading...</h1>
                </div>
            </div>
        );
    }
    if (!DEV_MODE && !isTokenValid) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Authentication Required
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Please login to access your upload history.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 px-6 py-10">
            <div className="text-center mb-12">
                <motion.h1
                    className="text-4xl font-extrabold text-indigo-800 dark:text-white mb-4"
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    Excel Analytics
                </motion.h1>
                <motion.p
                    className="text-lg text-gray-600 dark:text-gray-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    Explore your Excel data history with style, clarity, and confidence.
                </motion.p>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {uploads.length > 0 ? (
                        uploads.map((file, i) => (
                            <motion.div
                                key={file._id}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 hover:shadow-xl transition"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <FiFileText className="text-indigo-500 text-xl mr-2" />
                                        <div>
                                            <h3 className="font-semibold text-gray-800 dark:text-white">
                                                {file.filename}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{file.size}</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                    <strong>Headers:</strong> {file.headers.slice(0, 3).join(", ")}...
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Uploaded: {formatDate(file.date)}
                                </p>
                                <div className="flex justify-between mt-4">
                                    <button onClick={() => handleDownload(file._id, file.filename)} title="Download">
                                        <FiDownload className="text-indigo-600 hover:text-indigo-800 text-xl" />
                                    </button>
                                    <button onClick={() => handleView(file._id)} title="Visualize">
                                        <FiEye className="text-green-600 hover:text-green-800 text-xl" />
                                    </button>
                                    <button onClick={() => handleDelete(file._id)} title="Delete">
                                        <FiTrash2 className="text-red-600 hover:text-red-800 text-xl" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <p className="text-center text-gray-600 dark:text-gray-300 col-span-full">
                            No uploads found.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
