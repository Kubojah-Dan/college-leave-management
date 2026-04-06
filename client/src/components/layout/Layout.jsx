import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../hooks/useSocket'
import toast, { Toaster } from 'react-hot-toast'
import api from '../../services/api'

export default function Layout() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  async function fetchUnread() {
    try {
      const res = await api.get('/notifications')
      setUnreadCount(res.data.filter(n => !n.isRead).length)
    } catch {}
  }

  useEffect(() => { fetchUnread() }, [])

  useSocket(user?.id, (notification) => {
    setUnreadCount(c => c + 1)
    toast.custom((t) => (
      <div className={`bg-white border border-slate-100 shadow-lg rounded-xl px-4 py-3 flex items-start gap-3 max-w-sm animate-slide-up ${t.visible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-primary-600 text-sm">🔔</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{notification.message}</p>
        </div>
      </div>
    ), { duration: 5000 })
  })

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Toaster position="top-right" />
      <Sidebar unreadCount={unreadCount} />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
          <Outlet context={{ refreshUnread: fetchUnread }} />
        </div>
      </main>
    </div>
  )
}
