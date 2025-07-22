import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentToken } from '../store/authSlice';
import { motion } from 'framer-motion';
import { FaUserShield, FaUserAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
    const token = useSelector(selectCurrentToken);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('https://sageexcelbackend-production.up.railway.app/api/auth/getAllUsers', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    setUsers(data.users || []);
                    setLoading(false);
                } else {
                    console.error('Unauthorized access. Redirecting...');
                    navigate('/dashboard');
                }
            } catch (err) {
                console.error('Error fetching users:', err);
                navigate('/dashboard');
            }
        };

        fetchUsers();
        console.log(users);
    }, [token, navigate]);

    if (loading) return <div className="text-center mt-10 text-lg text-gray-600 dark:text-gray-300">Loading users...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors duration-200">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                🛠️ Admin Dashboard
            </h2>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md text-left">
                    <thead>
                        <tr className="text-gray-700 dark:text-gray-300 border-b dark:border-gray-600">
                            <th className="px-4 py-3">Username</th>
                            <th className="px-4 py-3">Files Uploaded</th>
                            <th className="px-4 py-3">Admin Status</th>
                            <th className="px-4 py-3">Analyses Made</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <motion.tr
                                key={user._id}
                                className="hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <td className="px-4 py-3 text-gray-900 dark:text-gray-200">
                                    {user.name || user.username || user.email}
                                </td>
                                <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-semibold">
                                    {user.filesUploaded || 0}
                                </td>
                                <td className="px-4 py-3">
                                    {user.isAdmin ? (
                                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                            <FaUserShield /> Admin
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                                            <FaUserAlt /> User
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-blue-600 dark:text-blue-300 font-semibold">
                                    {user.analysesMade || 0}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
