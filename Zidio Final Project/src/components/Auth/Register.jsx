// RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import excelChartAnim from './animations/Animation - 1749185585484.json';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import { toast } from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const isValidEmail = (email) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const forbiddenDomains = ['example.com', 'test.com', 'mail.com', 'demo.com'];
    if (!pattern.test(email)) return false;
    const domain = email.split('@')[1].toLowerCase();
    return !forbiddenDomains.includes(domain);
};

const isValidPassword = (password) =>
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z\d])[A-Za-z\d\W]{8,}$/.test(password);


export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [showPassword,setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { name, email, password, confirmPassword } = formData;

        if (!isValidEmail(email)) {
            toast.error('Please enter a valid email (no test domains like example.com)');
            return;
        }

        if (!isValidPassword(password)) {
            toast.error('Password must be at least 8 characters, include uppercase, lowercase, number, and special character');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        const url = new URLSearchParams();
        url.append('name', name);
        url.append('email', email);
        url.append('password', password);
        setIsLoading(true);

        try {
            const response = await fetch('https://sageexcelbackend-production.up.railway.app/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: url.toString(),
            });

            const data = await response.json();

            if (response.ok) {
                dispatch(setCredentials(data));
                navigate('/dashboard');
                toast.success('Registration successful!');
            } else {
                toast.error(data.message || 'Registration failed');
            }
        } catch (error) {
            toast.error('An error occurred during registration');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Animated Info Panel */}
            <motion.div
                className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-green-600 to-emerald-800 text-white p-10"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                <Lottie animationData={excelChartAnim} loop className="w-80 mb-6" />
                <h1 className="text-4xl font-bold mb-4">Join SageExcel</h1>
                <p className="text-lg text-center">
                    Unlock powerful Excel analytics tools. Start your journey to better insights today.
                </p>
            </motion.div>

            {/* Right Form Panel */}
            <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <motion.div
                    className="bg-white dark:bg-gray-800 bg-opacity-90 p-10 rounded-2xl shadow-xl w-full max-w-md"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">Create Account</h2>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full p-3 mb-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-3 mb-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                        />
                        <div className='relative flex items-center'>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full p-3 mb-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white pr-12"
                            required
                        />
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center text-lg text-gray-500 dark:text-gray-300 px-2 focus:outline-none cursor-pointer"
                            style={{ pointerEvents: 'auto' }}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                        </div>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full p-3 mb-6 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            disabled={isLoading}
                            className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Registering...' : 'Register'}
                        </motion.button>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
                            Login here
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
