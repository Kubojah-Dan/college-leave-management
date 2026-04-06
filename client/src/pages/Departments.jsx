import React, { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Building2, ChevronDown, ChevronRight, Users } from 'lucide-react'
import api from '../services/api'
import { PageLoader, EmptyState, Modal, ConfirmDialog } from '../components/ui/index'
import toast from 'react-hot-toast'

export default function Departments() {
  const [departments, setDepartments] = useState([])
  const [hods, setHods] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [modal, setModal] = useState(null)
  const [editDept, setEditDept] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', description: '', hodId: '' })
  const [saving, setSaving] = useState(false)
  const [sectionModal, setSectionModal] = useState(null)
  const [sectionName, setSectionName] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [d, u] = await Promise.all([api.get('/departments'), api.get('/users/role/all')])
      setDepartments(d.data); setHods(u.data)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openCreate() { setForm({ name: '', code: '', description: '', hodId: '' }); setEditDept(null); setModal('dept') }
  function openEdit(d) { setForm({ name: d.name, code: d.code, description: d.description || '', hodId: d.hodId || '' }); setEditDept(d); setModal('dept') }
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function toggle(id) { setExpanded(e => ({ ...e, [id]: !e[id] })) }

  async function saveDept() {
    setSaving(true)
    try {
      if (editDept) await api.put(`/departments/${editDept.id}`, form)
      else await api.post('/departments', form)
      toast.success(editDept ? 'Department updated!' : 'Department created!')
      setModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  async function deleteDept() {
    setDeleting(true)
    try { await api.delete(`/departments/${deleteTarget}`); toast.success('Deleted'); setDeleteTarget(null); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setDeleting(false) }
  }

  async function addSection() {
    if (!sectionName.trim()) return
    try {
      await api.post(`/departments/${sectionModal}/sections`, { name: sectionName })
      toast.success('Section added!'); setSectionName(''); setSectionModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  async function deleteSection(deptId, sectionId) {
    try { await api.delete(`/departments/${deptId}/sections/${sectionId}`); toast.success('Section removed'); load() }
    catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Departments</h1>
          <p className="text-slate-500 text-sm mt-1">{departments.length} departments</p>
          <div className="mt-2 h-1 w-12 rounded-full" style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} />Add Department</button>
      </div>

      {loading ? <PageLoader /> : departments.length === 0 ? (
        <EmptyState icon={Building2} title="No departments" description="Add your first department to get started." action={<button className="btn-primary" onClick={openCreate}>Add Department</button>} />
      ) : (
        <div className="space-y-3">
          {departments.map(d => (
            <div key={d.id} className="card p-0 overflow-hidden">
              <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggle(d.id)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  <Building2 size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">{d.name}</p>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">{d.code}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    HOD: {d.hod ? `${d.hod.firstName} ${d.hod.lastName}` : 'Not assigned'} · {d.sections?.length || 0} sections
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={e => { e.stopPropagation(); openEdit(d) }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={e => { e.stopPropagation(); setDeleteTarget(d.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                  {expanded[d.id] ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                </div>
              </div>

              {expanded[d.id] && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sections</p>
                    <button onClick={() => { setSectionModal(d.id); setSectionName('') }} className="btn-ghost btn-sm"><Plus size={12} />Add Section</button>
                  </div>
                  {d.sections?.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">No sections yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {d.sections.map(s => (
                        <div key={s.id} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                          <span className="text-sm text-slate-700">{s.name}</span>
                          <button onClick={() => deleteSection(d.id, s.id)} className="text-slate-300 hover:text-red-500 transition-colors ml-1">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dept Modal */}
      <Modal open={modal === 'dept'} onClose={() => setModal(null)} title={editDept ? 'Edit Department' : 'Add Department'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Computer Science" /></div>
            <div><label className="label">Code *</label><input className="input" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="CS" /></div>
          </div>
          <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></div>
          <div>
            <label className="label">Assign HOD</label>
            <select className="input" value={form.hodId} onChange={e => set('hodId', e.target.value)}>
              <option value="">Not assigned</option>
              {hods.map(h => <option key={h.id} value={h.id}>{h.firstName} {h.lastName} ({h.email})</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={saveDept} disabled={saving}>{saving ? '...' : editDept ? 'Save' : 'Create'}</button>
          </div>
        </div>
      </Modal>

      {/* Section Modal */}
      <Modal open={!!sectionModal} onClose={() => setSectionModal(null)} title="Add Section" size="sm">
        <div className="space-y-4">
          <div><label className="label">Section Name *</label><input className="input" value={sectionName} onChange={e => setSectionName(e.target.value)} placeholder="Section A" autoFocus /></div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setSectionModal(null)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={addSection}>Add Section</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={deleteDept}
        title="Delete Department" message="Delete this department? This cannot be undone."
        confirmLabel="Delete" variant="danger" loading={deleting} />
    </div>
  )
}
