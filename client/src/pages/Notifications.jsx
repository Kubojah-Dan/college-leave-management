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
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">{unread} unread</p>
          <div className="mt-2 h-1 w-12 rounded-full" style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
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
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={`card p-4 flex items-start gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${!n.isRead ? 'border-primary-200 bg-primary-50/40 hover:shadow-md' : 'hover:bg-slate-50'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base ${!n.isRead ? 'bg-primary-100' : 'bg-slate-100'}`}>
                {typeIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${!n.isRead ? 'text-slate-800' : 'text-slate-600'}`}>{n.title}</p>
                  {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock size={11} className="text-slate-400" />
                  <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
