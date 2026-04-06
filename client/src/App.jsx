import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import ApplyLeave from './pages/ApplyLeave'
import MyLeaves from './pages/MyLeaves'
import Approvals from './pages/Approvals'
import Users from './pages/Users'
import Departments from './pages/Departments'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'

function ProtectedRoute({ children, roles }) {
  const { isAuth, user } = useAuth()
  if (!isAuth) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/app/dashboard" replace />
  return children
}

function AppRoutes() {
  const { isAuth } = useAuth()
  return (
    <Routes>
      <Route path="/" element={isAuth ? <Navigate to="/app/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={isAuth ? <Navigate to="/app/dashboard" replace /> : <Login />} />
      <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard"     element={<Dashboard />} />
        <Route path="apply"         element={<ProtectedRoute roles={['student']}><ApplyLeave /></ProtectedRoute>} />
        <Route path="my-leaves"     element={<MyLeaves />} />
        <Route path="approvals"     element={<ProtectedRoute roles={['hod','principal','admin']}><Approvals /></ProtectedRoute>} />
        <Route path="users"         element={<ProtectedRoute roles={['admin','principal']}><Users /></ProtectedRoute>} />
        <Route path="departments"   element={<ProtectedRoute roles={['admin']}><Departments /></ProtectedRoute>} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings"      element={<Settings />} />
      </Route>
      {/* Legacy paths redirect */}
      <Route path="/dashboard"     element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/apply"         element={<Navigate to="/app/apply" replace />} />
      <Route path="/my-leaves"     element={<Navigate to="/app/my-leaves" replace />} />
      <Route path="/approvals"     element={<Navigate to="/app/approvals" replace />} />
      <Route path="/users"         element={<Navigate to="/app/users" replace />} />
      <Route path="/departments"   element={<Navigate to="/app/departments" replace />} />
      <Route path="/notifications" element={<Navigate to="/app/notifications" replace />} />
      <Route path="/settings"      element={<Navigate to="/app/settings" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', fontSize: '14px' } }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
