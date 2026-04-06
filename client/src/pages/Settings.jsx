import React, { useEffect, useRef, useState } from 'react'
import { Plus, Edit2, Trash2, Settings as SettingsIcon, Key, Camera, Mail, Phone, Shield, User } from 'lucide-react'
import api from '../services/api'
import { Modal, Alert } from '../components/ui/index'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const fileRef = useRef()
  const [leaveTypes, setLeaveTypes] = useState([])
  const [modal, setModal] = useState(null)
  const [editLt, setEditLt] = useState(null)
  const [ltForm, setLtForm] = useState({ name: '', code: '', maxDays: 10, requiresDocument: false, colorCode: '#3B82F6' })
  const [saving, setSaving] = useState(false)
  const [profileForm, setProfileForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '', password: '', confirmPassword: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '')

  async function loadLt() {
    try { const r = await api.get('/leave-types'); setLeaveTypes(r.data) } catch {}
  }

  useEffect(() => { loadLt() }, [])

  function openCreate() { setLtForm({ name: '', code: '', maxDays: 10, requiresDocument: false, colorCode: '#3B82F6' }); setEditLt(null); setModal('lt') }
  function openEdit(lt) { setLtForm({ name: lt.name, code: lt.code, maxDays: lt.maxDays, requiresDocument: lt.requiresDocument, colorCode: lt.colorCode }); setEditLt(lt); setModal('lt') }
  function setLt(k, v) { setLtForm(f => ({ ...f, [k]: v })) }

  async function saveLt() {
    setSaving(true)
    try {
      if (editLt) await api.put(`/leave-types/${editLt.id}`, ltForm)
      else await api.post('/leave-types', ltForm)
      toast.success(editLt ? 'Updated!' : 'Created!'); setModal(null); loadLt()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  async function deleteLt(id) {
    if (!confirm('Deactivate this leave type?')) return
    try { await api.delete(`/leave-types/${id}`); toast.success('Deactivated'); loadLt() } catch { toast.error('Failed') }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const res = await api.post('/auth/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refreshUser()
      setAvatarPreview(res.data.avatarUrl)
      toast.success('Profile photo updated!')
    } catch { toast.error('Failed to upload photo') }
    finally { setAvatarUploading(false) }
  }

  async function saveProfile(e) {
    e.preventDefault(); setProfileError('')
    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) { setProfileError('Passwords do not match'); return }
    setProfileSaving(true)
    try {
      const payload = { firstName: profileForm.firstName, lastName: profileForm.lastName, phone: profileForm.phone }
      if (profileForm.password) payload.password = profileForm.password
      await api.put('/auth/me', payload)
      await refreshUser()
      toast.success('Profile updated!')
      setProfileForm(f => ({ ...f, password: '', confirmPassword: '' }))
    } catch (err) { setProfileError(err.response?.data?.message || 'Failed') }
    finally { setProfileSaving(false) }
  }

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()
  const roleColors = { admin: '#6366f1', principal: '#0ea5e9', hod: '#10b981', student: '#f59e0b' }
  const roleColor = roleColors[user?.role] || '#6366f1'

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your profile and system configuration</p>
        <div className="mt-2 h-1 w-12 rounded-full" style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
      </div>

      {/* Profile Hero Card */}
      <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">
        {/* Banner */}
        <div className="h-28 relative" style={{ background: `linear-gradient(135deg, ${roleColor}22, ${roleColor}44), linear-gradient(135deg, #0f172a, #1e1b4b)` }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />
        </div>

        {/* Avatar + info row */}
        <div className="bg-white px-6 pb-6">
          <div className="flex items-end gap-5 -mt-12 mb-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden" style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)` }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">{initials}</div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl flex items-center justify-center shadow-md border-2 border-white transition-transform hover:scale-110"
                style={{ background: `linear-gradient(135deg, #6366f1, #8b5cf6)` }}
                title="Change photo"
              >
                {avatarUploading
                  ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Camera size={13} className="text-white" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Name + role badge */}
            <div className="pb-1 flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-800 truncate">{user?.firstName} {user?.lastName}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white capitalize" style={{ background: roleColor }}>
                  <Shield size={10} />{user?.role}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1"><Mail size={11} />{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Department', value: user?.department?.name || '—', icon: '🏛️' },
              { label: 'Section', value: user?.section?.name || '—', icon: '📚' },
              { label: 'Phone', value: user?.phone || '—', icon: '📱' },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-lg leading-none mb-1">{s.icon}</p>
                <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                <p className="text-sm font-semibold text-slate-700 truncate mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Edit form */}
          <form onSubmit={saveProfile} className="space-y-4">
            {profileError && <Alert type="error" message={profileError} />}

            <div className="flex items-center gap-2 mb-1">
              <User size={15} className="text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Personal Info</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">First Name</label><input className="input" value={profileForm.firstName} onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))} /></div>
              <div><label className="label">Last Name</label><input className="input" value={profileForm.lastName} onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))} /></div>
            </div>
            <div>
              <label className="label flex items-center gap-1"><Phone size={12} />Phone</label>
              <input className="input" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 mb-3"><Key size={14} className="text-slate-400" /><p className="text-sm font-semibold text-slate-700">Change Password</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">New Password</label><input className="input" type="password" value={profileForm.password} onChange={e => setProfileForm(f => ({ ...f, password: e.target.value }))} placeholder="Leave blank to keep" /></div>
                <div><label className="label">Confirm Password</label><input className="input" type="password" value={profileForm.confirmPassword} onChange={e => setProfileForm(f => ({ ...f, confirmPassword: e.target.value }))} /></div>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={profileSaving}>{profileSaving ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>
      </div>

      {/* Leave Types (admin only) */}
      {user?.role === 'admin' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SettingsIcon size={18} className="text-primary-600" />
              <h2 className="font-semibold text-slate-800">Leave Types</h2>
            </div>
            <button className="btn-primary btn-sm" onClick={openCreate}><Plus size={14} />Add Type</button>
          </div>
          <div className="space-y-2">
            {leaveTypes.map(lt => (
              <div key={lt.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: lt.colorCode }} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{lt.name}</p>
                  <p className="text-xs text-slate-500">Max {lt.maxDays} days · {lt.requiresDocument ? 'Document required' : 'No document needed'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(lt)} className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-slate-700 transition-colors"><Edit2 size={13} /></button>
                  <button onClick={() => deleteLt(lt.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave Type Modal */}
      <Modal open={modal === 'lt'} onClose={() => setModal(null)} title={editLt ? 'Edit Leave Type' : 'Add Leave Type'} size="sm">
        <div className="space-y-4">
          <div><label className="label">Name *</label><input className="input" value={ltForm.name} onChange={e => setLt('name', e.target.value)} placeholder="Sick Leave" /></div>
          <div><label className="label">Code *</label><input className="input" value={ltForm.code} onChange={e => setLt('code', e.target.value.toUpperCase())} placeholder="SICK" /></div>
          <div><label className="label">Max Days</label><input className="input" type="number" min={1} value={ltForm.maxDays} onChange={e => setLt('maxDays', parseInt(e.target.value))} /></div>
          <div><label className="label">Color</label><input className="input" type="color" value={ltForm.colorCode} onChange={e => setLt('colorCode', e.target.value)} /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="reqDoc" checked={ltForm.requiresDocument} onChange={e => setLt('requiresDocument', e.target.checked)} className="rounded" />
            <label htmlFor="reqDoc" className="text-sm text-slate-700">Requires supporting document</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={saveLt} disabled={saving}>{saving ? '...' : editLt ? 'Save' : 'Create'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
