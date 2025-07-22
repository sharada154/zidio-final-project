import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentToken } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Settings = () => {
    const token = useSelector(selectCurrentToken);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            if (!token) return;

            try {
                const response = await fetch('https://sageexcelbackend-production.up.railway.app/api/auth/getUser', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (response.ok) {
                    setIsAdmin(data.user.isAdmin);
                } else {
                    console.error('Failed to fetch user data:', data.message);
                }
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [token]);

    const handleChangePassword = async () => {
        navigate('/change-password');
    };

    if (loading) return <div className="p-4 text-gray-700 dark:text-gray-200">Loading settings...</div>;

    return (
        <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">⚙️ Account Settings</h1>

            <button
                onClick={handleChangePassword}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded mb-4"
            >
                Change Password
            </button>

            {isAdmin && (
                <button
                    onClick={() => navigate('/admin')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                >
                    Go to Admin Panel
                </button>
            )}
        </div>
    );
};

export default Settings;
