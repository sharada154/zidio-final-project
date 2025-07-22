import React from 'react'
import { useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Upload from './pages/Upload';
import History from './pages/History';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Visualize from './pages/Visualize';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import { Toaster } from 'react-hot-toast';
import Charts from './pages/Charts';
import ChartViewer from './pages/ChartViewer';
import ChangePassword from './pages/ChangePassword';
import AdminDashboardLayout from './components/Layout/AdminDashboardLayout';

function App() {
    const { token } = useSelector((state) => state.auth)

    // DEVELOPMENT SETTING - SET TO false WHEN READY FOR AUTH
    const DEV_BYPASS_AUTH = false

    return (
        <BrowserRouter>
            <Toaster position="top-right" />
            <Routes>
                {/* Public routes */}
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Development-only direct dashboard access */}
                {DEV_BYPASS_AUTH && (
                    <Route path="/dev" element={<DashboardLayout />}>
                        <Route index element={<Dashboard />} />
                    </Route>
                )}

                {/* Protected routes */}
                <Route
                    path="/"
                    element={DEV_BYPASS_AUTH || token ? <DashboardLayout /> : <Navigate to="/landing" replace />}
                >
                    <Route index element={<Dashboard />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="upload" element={<Upload />} />
                    <Route path="/visualize" element={<Visualize />} />
                    <Route path="history" element={<History />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="charts" element={<Charts />} />
                    <Route path="/chart/:chartId" element={<ChartViewer />} />
                    <Route path="change-password" element={<ChangePassword />} />
                    {/* Add other protected routes here */}
                </Route>

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
                <Route
                    path="/"
                    element={DEV_BYPASS_AUTH || token ? <AdminDashboardLayout /> : <Navigate to="/landing" replace />}
                >
                    <Route path="admin" element={<AdminDashboard />} />

                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App