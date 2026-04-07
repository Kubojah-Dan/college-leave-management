import React, { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Download, Eye, FileText, Filter } from 'lucide-react'
import api from '../services/api'
import { StatusBadge, PageLoader, EmptyState, Modal } from '../components/ui/index'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const STATUSES = ['', 'pending_hod', 'pending_principal', 'approved', 'rejected']

export default function Approvals() {
  const { user } = useAuth()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(user?.role === 'hod' ? 'pending_hod' : user?.role === 'principal' ? 'pending_principal' : '')
  const [actionLeave, setActionLeave] = useState(null)
  const [actionType, setActionType] = useState('')
  const [remarks, setRemarks] = useState('')
  const [acting, setActing] = useState(false)
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

  async function doAction() {
    setActing(true)
    try {
      await api.post(`/leaves/${actionLeave.id}/${actionType}`, { remarks })
      toast.success(actionType === 'approve' ? 'Leave approved!' : 'Leave rejected!')
      setActionLeave(null); setRemarks(''); load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally { setActing(false) }
  }

  async function downloadPDF(id) {
    try {
      const res = await api.get(`/leaves/${id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = `leave_${id}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
    } catch { toast.error('Download failed') }
  }

  async function downloadDocument(leaveId, docId, filename) {
    try {
      const res = await api.get(`/leaves/${leaveId}/documents/${docId}`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = filename || `document_${docId}`
      document.body.appendChild(a); a.click(); a.remove()
    } catch { toast.error('Failed to open document') }
  }

  const canAct = (leave) => {
    if (user?.role === 'hod') return leave.status === 'pending_hod'
    if (user?.role === 'principal') return leave.status === 'pending_principal'
    if (user?.role === 'admin') return ['pending_hod','pending_principal'].includes(leave.status)
    return false
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="section-title">
          <span className="section-title-accent">
            {user?.role === 'admin' ? 'All Leave Requests' : 'Leave Approvals'}
          </span>
        </h1>
        <p className="text-slate-500 text-sm mt-3">{leaves.length} record{leaves.length !== 1 ? 's' : ''}</p>
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
        <EmptyState icon={FileText} title="No leave requests" description="No requests match the selected filter." />
      ) : (
        <div className="table-modern-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Department</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(l => (
                <tr key={l.id}>
                  <td className="text-slate-400 text-xs font-mono">#{l.id}</td>
                  <td>
                    <div className="font-semibold text-slate-800">{l.student?.firstName} {l.student?.lastName}</div>
                    <div className="text-xs text-slate-400">{l.student?.email}</div>
                  </td>
                  <td>
                    <p className="text-sm text-slate-700 font-medium">{l.student?.department?.name || '—'}</p>
                    <p className="text-xs text-slate-400">{l.student?.section?.name || ''}</p>
                  </td>
                  <td>
                    <span className="font-semibold text-slate-700">{l.leaveType}</span>
                    {l.documents?.length > 0 && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">📎{l.documents.length}</span>
                    )}
                  </td>
                  <td className="text-xs">
                    <p className="font-medium">{l.startDate}</p>
                    <p className="text-slate-400">to {l.endDate}</p>
                  </td>
                  <td><span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-lg text-xs font-bold">{l.totalDays}d</span></td>
                  <td><StatusBadge status={l.status} /></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewLeave(l)} className="p-2 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all" title="View">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => downloadPDF(l.id)} className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-all" title="PDF">
                        <Download size={15} />
                      </button>
                      {canAct(l) && (
                        <>
                          <button onClick={() => { setActionLeave(l); setActionType('approve'); setRemarks('') }}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-all" title="Approve">
                            <CheckCircle size={15} />
                          </button>
                          <button onClick={() => { setActionLeave(l); setActionType('reject'); setRemarks('') }}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all" title="Reject">
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Modal */}
      <Modal open={!!actionLeave} onClose={() => setActionLeave(null)}
        title={actionType === 'approve' ? '✅ Approve Leave' : '❌ Reject Leave'} size="sm">
        {actionLeave && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
              <p><span className="text-slate-500">Student:</span> <span className="font-medium">{actionLeave.student?.firstName} {actionLeave.student?.lastName}</span></p>
              <p><span className="text-slate-500">Leave:</span> <span className="font-medium">{actionLeave.leaveType}</span></p>
              <p><span className="text-slate-500">Dates:</span> <span className="font-medium">{actionLeave.startDate} → {actionLeave.endDate} ({actionLeave.totalDays}d)</span></p>
              <p><span className="text-slate-500">Reason:</span> {actionLeave.reason}</p>
            </div>
            <div>
              <label className="label">Remarks {actionType === 'reject' ? '(required)' : '(optional)'}</label>
              <textarea className="input resize-none" rows={3} value={remarks} onChange={e => setRemarks(e.target.value)}
                placeholder={actionType === 'approve' ? 'Add any comments...' : 'Reason for rejection...'} />
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setActionLeave(null)} disabled={acting}>Cancel</button>
              <button
                className={actionType === 'approve' ? 'btn-success flex-1' : 'btn-danger flex-1'}
                onClick={doAction}
                disabled={acting || (actionType === 'reject' && !remarks.trim())}
              >
                {acting ? '...' : actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewLeave} onClose={() => setViewLeave(null)} title={`Leave #${viewLeave?.id} Details`} size="lg">
        {viewLeave && <LeaveDetailView leave={viewLeave} />}
      </Modal>
    </div>
  )
}

function LeaveDetailView({ leave }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div><p className="text-slate-500">Student</p><p className="font-semibold">{leave.student?.firstName} {leave.student?.lastName}</p></div>
        <div><p className="text-slate-500">Department</p><p className="font-semibold">{leave.student?.department?.name || '—'}</p></div>
        <div><p className="text-slate-500">Section</p><p className="font-semibold">{leave.student?.section?.name || '—'}</p></div>
        <div><p className="text-slate-500">Status</p><StatusBadge status={leave.status} /></div>
        <div><p className="text-slate-500">From</p><p className="font-semibold">{leave.startDate}</p></div>
        <div><p className="text-slate-500">To</p><p className="font-semibold">{leave.endDate}</p></div>
      </div>
      <div><p className="text-slate-500 mb-1">Reason</p><p className="bg-slate-50 rounded-lg p-3">{leave.reason || '—'}</p></div>
      {leave.hodRemarks && <div><p className="text-slate-500 mb-1">HOD Remarks</p><p className="bg-amber-50 rounded-lg p-3 text-amber-800">{leave.hodRemarks}</p></div>}
      {leave.principalRemarks && <div><p className="text-slate-500 mb-1">Principal Remarks</p><p className="bg-blue-50 rounded-lg p-3 text-blue-800">{leave.principalRemarks}</p></div>}
      {leave.documents?.length > 0 && (
        <div>
          <p className="text-slate-500 mb-2">Documents</p>
          {leave.documents.map(d => (
            <button key={d.id} type="button" onClick={() => downloadDocument(leave.id, d.id, d.fileName)}
              className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 mb-1 text-left w-full">
              <FileText size={14} className="text-slate-400" /><span className="text-xs">{d.fileName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
