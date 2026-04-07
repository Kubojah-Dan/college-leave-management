import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, X, FileText, Filter, PlusCircle, Eye } from 'lucide-react'
import api from '../services/api'
import { StatusBadge, PageLoader, EmptyState, ConfirmDialog, Modal } from '../components/ui/index'
import { useAuth } from '../context/AuthContext'

const STATUSES = ['', 'pending_hod', 'pending_principal', 'approved', 'rejected', 'cancelled']

export default function MyLeaves() {
  const { user } = useAuth()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [viewLeave, setViewLeave] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const params = filter ? `?status=${filter}` : ''
      const res = await api.get(`/leaves${params}`)
      setLeaves(res.data)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  async function downloadPDF(id) {
    try {
      const res = await api.get(`/leaves/${id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = `leave_${id}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
    } catch { alert('Download failed') }
  }

  async function downloadDocument(leaveId, docId, filename) {
    try {
      const res = await api.get(`/leaves/${leaveId}/documents/${docId}`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = filename || `document_${docId}`
      document.body.appendChild(a); a.click(); a.remove()
    } catch { alert('Failed to open document') }
  }

  async function cancelLeave() {
    setCancelling(true)
    try { await api.post(`/leaves/${cancelTarget}/cancel`); setCancelTarget(null); load() }
    catch (err) { alert(err.response?.data?.message || 'Failed to cancel') }
    finally { setCancelling(false) }
  }

  const isStudent = user?.role === 'student'

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">
            <span className="section-title-accent">{isStudent ? 'My Leaves' : 'All Leaves'}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-3">{leaves.length} record{leaves.length !== 1 ? 's' : ''} found</p>
        </div>
        {isStudent && (
          <Link to="/apply" className="btn-primary px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
            <PlusCircle size={16} />Apply Leave
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={16} className="text-slate-400" />
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`filter-pill ${filter === s ? 'filter-pill-active' : ''}`}>
            {s === '' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : leaves.length === 0 ? (
        <EmptyState icon={FileText} title="No leaves found" description="No leave requests match your filter."
          action={isStudent ? <Link to="/apply" className="btn-primary">Apply for Leave</Link> : null} />
      ) : (
        <div className="table-modern-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>#</th>
                {!isStudent && <th>Student</th>}
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(l => (
                <tr key={l.id}>
                  <td className="text-slate-400 text-xs font-mono">#{l.id}</td>
                  {!isStudent && (
                    <td>
                      <div className="font-semibold text-slate-800">{l.student?.firstName} {l.student?.lastName}</div>
                      <div className="text-xs text-slate-400">{l.student?.department?.name}</div>
                    </td>
                  )}
                  <td>
                    <span className="font-semibold text-slate-700">{l.leaveType}</span>
                    {l.documents?.length > 0 && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">📎{l.documents.length}</span>
                    )}
                  </td>
                  <td className="font-medium">{l.startDate}</td>
                  <td className="font-medium">{l.endDate}</td>
                  <td><span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-lg text-xs font-bold">{l.totalDays}d</span></td>
                  <td><StatusBadge status={l.status} /></td>
                  <td className="text-slate-500 text-xs">{new Date(l.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewLeave(l)} className="p-2 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all" title="View details">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => downloadPDF(l.id)} className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-all" title="Download PDF">
                        <Download size={15} />
                      </button>
                      {isStudent && ['pending_hod','pending_principal'].includes(l.status) && (
                        <button onClick={() => setCancelTarget(l.id)} className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all" title="Cancel">
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={cancelLeave}
        title="Cancel Leave Request" message="Are you sure you want to cancel this leave request? This action cannot be undone."
        confirmLabel="Yes, Cancel" variant="danger" loading={cancelling} />

      <Modal open={!!viewLeave} onClose={() => setViewLeave(null)} title={`Leave #${viewLeave?.id} Details`} size="lg">
        {viewLeave && <LeaveDetail leave={viewLeave} />}
      </Modal>
    </div>
  )
}

function LeaveDetail({ leave }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div><p className="text-slate-500">Type</p><p className="font-semibold">{leave.leaveType}</p></div>
        <div><p className="text-slate-500">Status</p><StatusBadge status={leave.status} /></div>
        <div><p className="text-slate-500">From</p><p className="font-semibold">{leave.startDate}</p></div>
        <div><p className="text-slate-500">To</p><p className="font-semibold">{leave.endDate}</p></div>
        <div><p className="text-slate-500">Total Days</p><p className="font-semibold">{leave.totalDays}</p></div>
        <div><p className="text-slate-500">Applied</p><p className="font-semibold">{new Date(leave.createdAt).toLocaleDateString()}</p></div>
      </div>
      <div><p className="text-slate-500 mb-1">Reason</p><p className="bg-slate-50 rounded-lg p-3 text-slate-700">{leave.reason || '—'}</p></div>
      {leave.hodRemarks && <div><p className="text-slate-500 mb-1">HOD Remarks</p><p className="bg-amber-50 rounded-lg p-3 text-amber-800">{leave.hodRemarks}</p></div>}
      {leave.principalRemarks && <div><p className="text-slate-500 mb-1">Principal Remarks</p><p className="bg-blue-50 rounded-lg p-3 text-blue-800">{leave.principalRemarks}</p></div>}
      {leave.documents?.length > 0 && (
        <div>
          <p className="text-slate-500 mb-2">Documents ({leave.documents.length})</p>
          <div className="space-y-2">
            {leave.documents.map(d => (
              <button key={d.id} type="button" onClick={() => downloadDocument(leave.id, d.id, d.fileName)}
                className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors w-full text-left">
                <FileText size={14} className="text-slate-400" />
                <span className="text-slate-700 text-xs">{d.fileName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}