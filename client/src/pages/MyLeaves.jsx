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
          <h1 className="text-2xl font-bold text-slate-800">{isStudent ? 'My Leaves' : 'All Leaves'}</h1>
          <p className="text-slate-500 text-sm mt-1">{leaves.length} record{leaves.length !== 1 ? 's' : ''} found</p>
          <div className="mt-2 h-1 w-12 rounded-full" style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
        </div>
        {isStudent && <Link to="/apply" className="btn-primary"><PlusCircle size={16} />Apply Leave</Link>}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-slate-400" />
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${filter === s ? 'text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            style={filter === s ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' } : {}}>
            {s === '' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : leaves.length === 0 ? (
        <EmptyState icon={FileText} title="No leaves found" description="No leave requests match your filter."
          action={isStudent ? <Link to="/apply" className="btn-primary">Apply for Leave</Link> : null} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrapper">
            <table className="table">
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
                    <td className="text-slate-400 text-xs">#{l.id}</td>
                    {!isStudent && <td className="font-medium">{l.student?.firstName} {l.student?.lastName}<br/><span className="text-xs text-slate-400">{l.student?.department?.name}</span></td>}
                    <td>
                      <span className="font-medium text-slate-700">{l.leaveType}</span>
                      {l.documents?.length > 0 && <span className="ml-1 text-xs text-slate-400">📎{l.documents.length}</span>}
                    </td>
                    <td>{l.startDate}</td>
                    <td>{l.endDate}</td>
                    <td className="font-medium">{l.totalDays}d</td>
                    <td><StatusBadge status={l.status} /></td>
                    <td className="text-xs text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewLeave(l)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors" title="View details">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => downloadPDF(l.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors" title="Download PDF">
                          <Download size={15} />
                        </button>
                        {isStudent && ['pending_hod','pending_principal'].includes(l.status) && (
                          <button onClick={() => setCancelTarget(l.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors" title="Cancel">
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
        </div>
      )}

      <ConfirmDialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={cancelLeave}
        title="Cancel Leave Request" message="Are you sure you want to cancel this leave request? This action cannot be undone."
        confirmLabel="Yes, Cancel" variant="danger" loading={cancelling} />

      {/* View Details Modal */}
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
