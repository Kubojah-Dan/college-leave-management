import React, { useEffect } from 'react'
import { X, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

// ── Badge ──────────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    pending_hod:       { label: 'Pending HOD',       cls: 'bg-amber-100 text-amber-800 border border-amber-200' },
    pending_principal: { label: 'Pending Principal',  cls: 'bg-blue-100 text-blue-800 border border-blue-200' },
    approved:          { label: 'Approved',           cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    rejected:          { label: 'Rejected',           cls: 'bg-red-100 text-red-800 border border-red-200' },
    cancelled:         { label: 'Cancelled',          cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
  }
  const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
}

export function RoleBadge({ role }) {
  const map = {
    admin:     'bg-purple-100 text-purple-800',
    principal: 'bg-indigo-100 text-indigo-800',
    hod:       'bg-cyan-100 text-cyan-800',
    student:   'bg-slate-100 text-slate-700',
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[role] || 'bg-slate-100 text-slate-700'}`}>{role?.toUpperCase()}</span>
}

// ── Spinner ────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size]
  return (
    <div className={`${sz} border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin ${className}`} />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${widths[size]} animate-slide-up max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger', loading = false }) {
  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-slate-600 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
        <button
          className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" /> : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4"><Icon size={28} className="text-slate-400" /></div>}
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

// ── Alert ──────────────────────────────────────────────────────────────────
export function Alert({ type = 'info', message }) {
  if (!message) return null
  const map = {
    info:    { cls: 'bg-blue-50 border-blue-200 text-blue-800',    Icon: Info },
    success: { cls: 'bg-emerald-50 border-emerald-200 text-emerald-800', Icon: CheckCircle },
    error:   { cls: 'bg-red-50 border-red-200 text-red-800',       Icon: XCircle },
    warning: { cls: 'bg-amber-50 border-amber-200 text-amber-800', Icon: AlertTriangle },
  }
  const { cls, Icon } = map[type]
  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-lg border text-sm ${cls}`}>
      <Icon size={16} className="mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// ── Stats Card ─────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',    icon: 'bg-blue-100 text-blue-600' },
    green:  { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600' },
    amber:  { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-600' },
    red:    { bg: 'bg-red-50',     icon: 'bg-red-100 text-red-600' },
    purple: { bg: 'bg-purple-50',  icon: 'bg-purple-100 text-purple-600' },
    indigo: { bg: 'bg-indigo-50',  icon: 'bg-indigo-100 text-indigo-600' },
  }
  const c = colors[color] || colors.blue
  return (
    <div className={`card flex items-center gap-4 ${c.bg} border-0`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}
