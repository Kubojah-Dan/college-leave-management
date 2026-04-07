import React, { useEffect, useState } from 'react'
import { Bell, CheckCheck, Clock } from 'lucide-react'
import api from '../services/api'
import { PageLoader, EmptyState } from '../components/ui/index'
import { useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const ctx = useOutletContext()

  async function load() {
    setLoading(true)
    try { const r = await api.get('/notifications'); setNotifications(r.data) }
    catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function markRead(id) {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x))
      ctx?.refreshUnread?.()
    } catch {}
  }

  async function markAllRead() {
    try {
      await api.put('/notifications/read-all')
      setNotifications(n => n.map(x => ({ ...x, isRead: true })))
      ctx?.refreshUnread?.()
      toast.success('All marked as read')
    } catch {}
  }

  const unread = notifications.filter(n => !n.isRead).length

  const typeIcon = (type) => {
    const map = { leave_status: '📋', approval_required: '⏳', document_uploaded: '📎', reminder: '⏰', system: '⚙️' }
    return map[type] || '🔔'
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">
            <span className="section-title-accent">Notifications</span>
          </h1>
          <p className="text-slate-500 text-sm mt-3">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button className="btn-ghost btn-sm" onClick={markAllRead}>
            <CheckCheck size={15} />Mark all read
          </button>
        )}
      </div>

      {loading ? <PageLoader /> : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up! Notifications will appear here." />
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={`dashboard-glass-card p-5 flex items-start gap-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${!n.isRead ? 'border-l-4 border-l-indigo-500' : 'hover:border-l-4 hover:border-l-indigo-200'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg shadow-md ${!n.isRead ? 'bg-gradient-to-br from-indigo-500 to-purple-500' : 'bg-slate-200'}`}>
                {typeIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-bold ${!n.isRead ? 'text-slate-800' : 'text-slate-600'}`}>{n.title}</p>
                  {!n.isRead && <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex-shrink-0 shadow-md animate-pulse" />}
                </div>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{n.message}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock size={12} className="text-slate-400" />
                  <span className="text-xs text-slate-400 font-medium">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
