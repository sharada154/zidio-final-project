import React, { useEffect, useState } from 'react';
import { selectCurrentToken,selectCurrentUser } from '../store/authSlice';
import { useSelector } from 'react-redux'
import SendRequest from '../../src/api/SendRequest';

const Profile = () => {
    const [profile,SetProfile] = useState({
        email:"",
        name:""
    });
    const  token  = useSelector(selectCurrentToken)

    //this makes so that it will always verify the token once when the page is loaded at first
    useEffect(()=>{
        (async () => {
            try {
                const response = await fetch('https://sageexcelbackend-production.up.railway.app/api/auth/getUser',{
                    method:'GET',
                    headers:{
                        'Authorization':`Bearer ${token}`
                    }
                });
                const data = await response.json()
                SetProfile({
                    email: data.user.email,
                    name: data.user.name
                });
                } catch (error) {
                console.error(error);
                toast.error('Session expired. Please login again.');
            }
        })();
    },[token])

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors duration-200">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Your Profile</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-4">Personal Information</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{profile.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{profile.email}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;