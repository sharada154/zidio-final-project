import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentToken } from '../store/authSlice';
import SendRequest from '../../src/api/SendRequest';
import { motion } from 'framer-motion';
import { FaFileAlt, FaChartBar, FaSave } from 'react-icons/fa';

const Dashboard = () => {
    const token = useSelector(selectCurrentToken);
    const [file, setFile] = useState([]);
    const [analysis, setAnalysis] = useState([]);

    useEffect(() => {
        const getInfo = async () => {
            try {
            const response = await fetch('https://sageexcelbackend-production.up.railway.app/api/auth/getData', {
                method: 'GET',
                headers: {
                'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (response.ok) {
                // Directly set files and analyses
                setFile(data.files || []);
                setAnalysis(data.analyses || []);
            } else {
                console.error('Fetch error:', data.message);
            }
            } catch (error) {
            console.error('Error fetching dashboard summary:', error);
            }
        };

        getInfo();
        }, [token]);

        const formatDate = (date) =>
        new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

            const stats = [
            { icon: <FaFileAlt />, label: 'Files Uploaded', value: file.length },
            { icon: <FaChartBar />, label: 'Analyses Performed', value: analysis.length },
            { icon: <FaSave />, label: 'Saved Charts', value: analysis.length }, // same here
            ];

            const activities = [
            ...file.slice(-2).reverse().map(f => ({
                action: `Uploaded ${f.filename}`,
                time: formatDate(f.date),
            })),
            ...analysis.slice(-1).reverse().map(a => ({
                action: `Saved chart "${a.chartTitle}" for ${a.fileName}`,
                time: formatDate(a.createdAt),
            }))
            ];

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors duration-200">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                📊 Welcome to your Dashboard
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map(({ icon, label, value }, index) => (
                    <motion.div
                        key={label}
                        className="bg-gray-50 dark:bg-gray-700 p-5 rounded-xl shadow-md"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.2 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="text-indigo-600 dark:text-indigo-400 text-3xl">{icon}</div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{label}</h3>
                                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-10">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">📁 Recent Activity</h3>
                <div className="space-y-4">
                    {activities.map((activity, i) => (
                        <motion.div
                            key={i}
                            className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md shadow-sm"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.15 }}
                        >
                            <p className="text-gray-700 dark:text-gray-200">{activity.action}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
