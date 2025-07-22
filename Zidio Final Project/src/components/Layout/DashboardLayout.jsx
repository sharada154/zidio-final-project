import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const DashboardLayout = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const navLinkClass = ({ isActive }) =>
        isActive
            ? 'relative text-indigo-100 dark:text-indigo-400 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-white dark:after:bg-indigo-400'
            : 'text-gray-300 hover:text-white dark:hover:text-indigo-200 relative transition-colors duration-200';

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 bg-[url('/pattern.svg')] bg-top bg-fixed">
            <nav className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 shadow-lg fixed top-0 left-0 right-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="flex items-center">
                        <button
                            className="sm:hidden text-white mr-4"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </button>
                        <h1 className="text-xl font-bold text-white">SageExcel</h1>
                        <div className="hidden sm:flex sm:space-x-8 ml-6">
                            <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
                            <NavLink to="/upload" className={navLinkClass}>Upload</NavLink>
                            <NavLink to="/history" className={navLinkClass}>History</NavLink>
                            <NavLink to="/charts" className = {navLinkClass}>Charts</NavLink>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="group relative" ref={dropdownRef}>
                            <button
                                type="button"
                                className="flex rounded-full bg-white dark:bg-gray-800 text-sm focus:outline-none"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-medium">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            </button>
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max px-2 py-1 text-xs rounded bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                                Hello, {user?.name?.split(' ')[0] || 'User'}!
                            </span>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-50"
                                    >
                                        <NavLink to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Your Profile</NavLink>
                                        <NavLink to="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Settings</NavLink>
                                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Sign out</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </nav>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ duration: 0.3 }}
                        className="fixed top-0 left-0 z-40 w-64 h-full bg-white dark:bg-gray-800 shadow-lg p-4"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Menu</h2>
                            <button onClick={() => setIsMobileMenuOpen(false)}>
                                <XMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                            </button>
                        </div>
                        <nav className="flex flex-col space-y-4">
                            <NavLink to="/dashboard" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</NavLink>
                            <NavLink to="/upload" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Upload</NavLink>
                            <NavLink to="/history" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>History</NavLink>
                        </nav>
                    </motion.aside>
                )}
            </AnimatePresence>

            <main className="pt-20">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="px-4 py-6 sm:px-0"
                    >
                        <Outlet />
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
