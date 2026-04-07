import React, { useEffect, useRef, useState } from 'react'
import { Plus, Edit2, Trash2, Users as UsersIcon, Search, Camera } from 'lucide-react'
import api from '../services/api'
import { RoleBadge, PageLoader, EmptyState, Modal, ConfirmDialog } from '../components/ui/index'
import toast from 'react-hot-toast'

export default function Users() {
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [modal, setModal] = useState(null) // null | 'create' | 'edit'
  const [editUser, setEditUser] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'student', departmentId: '', sectionId: '', isActive: true })
  const [sections, setSections] = useState([])
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const avatarRef = useRef()

  async function load() {
    setLoading(true)
    try {
      const [u, d] = await Promise.all([api.get('/users'), api.get('/departments')])
      setUsers(u.data); setDepartments(d.data)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'student', departmentId: '', sectionId: '', isActive: true })
    setSections([]); setEditUser(null); setAvatarPreview(''); setAvatarFile(null); setModal('create')
  }

  function openEdit(u) {
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', phone: u.phone || '', role: u.role, departmentId: u.departmentId || '', sectionId: u.sectionId || '', isActive: u.isActive })
    const dept = departments.find(d => d.id === u.departmentId)
    setSections(dept?.sections || [])
    setEditUser(u); setAvatarPreview(u.avatarUrl || ''); setAvatarFile(null); setModal('edit')
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function onDeptChange(id) {
    set('departmentId', id); set('sectionId', '')
    const dept = departments.find(d => String(d.id) === String(id))
    setSections(dept?.sections || [])
  }

  async function save() {
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      let savedUser
      if (modal === 'create') { const r = await api.post('/users', payload); savedUser = r.data }
      else { const r = await api.put(`/users/${editUser.id}`, payload); savedUser = r.data }
      // upload avatar if selected
      if (avatarFile && savedUser?.id) {
        const fd = new FormData(); fd.append('avatar', avatarFile)
        await api.post(`/users/${savedUser.id}/avatar`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      toast.success(modal === 'create' ? 'User created!' : 'User updated!')
      setModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  async function deleteUser() {
    setDeleting(true)
    try { await api.delete(`/users/${deleteTarget}`); toast.success('User deleted'); setDeleteTarget(null); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setDeleting(false) }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q)
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">
            <span className="section-title-accent">Users</span>
          </h1>
          <p className="text-slate-500 text-sm mt-3">{users.length} total users</p>
        </div>
        <button className="btn-primary px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5" onClick={openCreate}>
          <Plus size={16} />Add User
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-40" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {['admin','principal','hod','student'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
        </select>
      </div>

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" description="Try adjusting your search or filters." />
      ) : (
        <div className="table-modern-wrapper">
          <table className="table-modern">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
                        <span className="text-white font-bold text-sm">{u.firstName?.[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-slate-400">{u.phone || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-slate-600">{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td className="text-sm text-slate-600 font-medium">{u.department?.name || '—'}</td>
                  <td>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${u.isActive ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md' : 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} className="p-2 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all"><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteTarget(u.id)} className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add New User' : 'Edit User'} size="md">
        <div className="space-y-4">
          {/* Avatar picker */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-slate-400">{form.firstName?.[0]?.toUpperCase() || '?'}</span>
                }
              </div>
              <button type="button" onClick={() => avatarRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center shadow border-2 border-white hover:bg-indigo-700 transition-colors">
                <Camera size={11} className="text-white" />
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)) } }} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Profile Photo</p>
              <p className="text-xs text-slate-400 mt-0.5">Click the camera icon to upload</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First Name *</label><input className="input" value={form.firstName} onChange={e => set('firstName', e.target.value)} required /></div>
            <div><label className="label">Last Name</label><input className="input" value={form.lastName} onChange={e => set('lastName', e.target.value)} /></div>
          </div>
          <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
          <div><label className="label">{modal === 'create' ? 'Password *' : 'New Password (leave blank to keep)'}</label><input className="input" type="password" value={form.password} onChange={e => set('password', e.target.value)} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role *</label>
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                {['admin','principal','hod','student'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.isActive ? 'true' : 'false'} onChange={e => set('isActive', e.target.value === 'true')}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Department</label>
            <select className="input" value={form.departmentId} onChange={e => onDeptChange(e.target.value)}>
              <option value="">None</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          {sections.length > 0 && (
            <div>
              <label className="label">Section</label>
              <select className="input" value={form.sectionId} onChange={e => set('sectionId', e.target.value)}>
                <option value="">None</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={save} disabled={saving}>{saving ? '...' : modal === 'create' ? 'Create User' : 'Save Changes'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={deleteUser}
        title="Delete User" message="Are you sure you want to delete this user? All their data will be removed."
        confirmLabel="Delete" variant="danger" loading={deleting} />
    </div>
  )
}
