import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, FileText, CheckCircle, Loader2 } from 'lucide-react'
import api from '../services/api'
import { Alert } from '../components/ui/index'

export default function ApplyLeave() {
  const navigate = useNavigate()
  const [leaveTypes, setLeaveTypes] = useState([])
  const [form, setForm] = useState({ leaveTypeId: '', leaveType: '', startDate: '', endDate: '', reason: '' })
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    api.get('/leave-types').then(r => {
      setLeaveTypes(r.data)
      if (r.data.length) setForm(f => ({ ...f, leaveTypeId: r.data[0].id, leaveType: r.data[0].name }))
    }).catch(() => {})
  }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function onTypeChange(id) {
    const lt = leaveTypes.find(t => String(t.id) === String(id))
    setForm(f => ({ ...f, leaveTypeId: id, leaveType: lt?.name || '' }))
  }

  function onFileChange(e) {
    const newFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...newFiles].slice(0, 5))
    e.target.value = ''
  }

  function removeFile(i) { setFiles(f => f.filter((_, idx) => idx !== i)) }

  const totalDays = () => {
    if (!form.startDate || !form.endDate) return 0
    const diff = (new Date(form.endDate) - new Date(form.startDate)) / 86400000
    return Math.max(1, Math.round(diff) + 1)
  }

  async function submit(e) {
    e.preventDefault()
    if (new Date(form.endDate) < new Date(form.startDate)) { setError('End date must be after start date'); return }
    setError(''); setLoading(true)
    try {
      const res = await api.post('/leaves', { ...form })
      const leaveId = res.data.id
      // Upload files
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        await api.post(`/leaves/${leaveId}/documents`, fd)
      }
      setSuccess(true)
      setTimeout(() => navigate('/my-leaves'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit leave')
    } finally {
      setLoading(false)
    }
  }

  const selectedType = leaveTypes.find(t => String(t.id) === String(form.leaveTypeId))

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] animate-slide-up">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Leave Submitted!</h2>
        <p className="text-slate-500 text-sm">Your leave request has been sent to your HOD for review.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Apply for Leave</h1>
        <p className="text-slate-500 mt-1 text-sm">Fill in the details below to submit your leave request</p>
        <div className="mt-3 h-1 w-16 rounded-full" style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
      </div>

      <form onSubmit={submit} className="space-y-5">
        {error && <Alert type="error" message={error} />}

        {/* Leave Type */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2"><span className="w-1 h-4 rounded-full inline-block" style={{background:'linear-gradient(180deg,#6366f1,#8b5cf6)'}}/>Leave Details</h3>

          <div>
            <label className="label">Leave Type *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {leaveTypes.map(lt => (
                <button
                  key={lt.id}
                  type="button"
                  onClick={() => onTypeChange(lt.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                    String(form.leaveTypeId) === String(lt.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full mb-1.5" style={{ backgroundColor: lt.colorCode }} />
                  <p className="text-xs font-semibold text-slate-700">{lt.name}</p>
                  <p className="text-xs text-slate-400">Max {lt.maxDays} days</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date *</label>
              <input className="input" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]} required />
            </div>
            <div>
              <label className="label">End Date *</label>
              <input className="input" type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                min={form.startDate || new Date().toISOString().split('T')[0]} required />
            </div>
          </div>

          {form.startDate && form.endDate && (
            <div className="bg-primary-50 border border-primary-100 rounded-lg px-4 py-2.5 text-sm text-primary-700 font-medium">
              📅 Total: {totalDays()} day{totalDays() !== 1 ? 's' : ''}
            </div>
          )}

          <div>
            <label className="label">Reason *</label>
            <textarea className="input resize-none" rows={4} value={form.reason} onChange={e => set('reason', e.target.value)}
              placeholder="Describe the reason for your leave request..." required minLength={10} />
          </div>
        </div>

        {/* Documents */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2"><span className="w-1 h-4 rounded-full inline-block" style={{background:'linear-gradient(180deg,#6366f1,#8b5cf6)'}}/>Supporting Documents</h3>
            {selectedType?.requiresDocument && <span className="text-xs text-red-500 font-medium">Required for this leave type</span>}
          </div>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all duration-200">
            <Upload size={24} className="text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-600">Click to upload files</p>
            <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG up to 10MB each (max 5 files)</p>
            <input type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={onFileChange} />
          </label>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <FileText size={16} className="text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700 flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
                  <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Submit Leave Request
          </button>
        </div>
      </form>
    </div>
  )
}
