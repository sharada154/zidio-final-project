import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentToken, logout } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const ChangePassword = () => {
  const token = useSelector(selectCurrentToken);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValidPassword = (password) =>
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z\d])[A-Za-z\d\W]{8,}$/.test(password);   

    if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        return;      
    }
    if (isValidPassword(newPassword) === false) {
        toast.error('Password must be at least 8 characters, include uppercase, lowercase, number, and special character');
        return;    
    }
    try {
      const res = await fetch('https://sageexcelbackend-production.up.railway.app/api/auth/changePassword', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok){
        toast.error('password not changed successfully');
      }else{
      toast.success('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Log out and redirect to login
      setTimeout(() => {
        dispatch(logout());
        toast('Please log in again with your new password.');
        navigate('/login');
      }, 1200);
    }
    } catch (err) {
      console.log(err);
      toast.error('Server error. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">🔒 Change Password</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
       

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Old Password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full px-4 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Change Password
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
