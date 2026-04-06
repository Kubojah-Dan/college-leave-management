import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, Loader2, Mail, Lock, User, Phone, ChevronRight, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/ui/index'
import api from '../services/api'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(() => searchParams.get('tab') === 'register' ? 'register' : 'login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [departments, setDepartments] = useState([])
  const [sections, setSections] = useState([])
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'student', departmentId: '', sectionId: '' })

  async function loadDepts() {
    try { const r = await api.get('/departments'); setDepartments(r.data) } catch {}
  }

  async function onDeptChange(deptId) {
    setForm(f => ({ ...f, departmentId: deptId, sectionId: '' }))
    const dept = departments.find(d => String(d.id) === String(deptId))
    setSections(dept?.sections || [])
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName, phone: form.phone, role: form.role, departmentId: form.departmentId || null, sectionId: form.sectionId || null })
      }
      navigate('/app/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function switchMode(m) {
    setMode(m); setError('')
    if (m === 'register') loadDepts()
  }

  return (
    <div className="fixed inset-0" style={{ backgroundImage: 'url(/college.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* Animated glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-slow-delay" />
      </div>

      {/* Scrollable content layer */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4 py-10">

      <div className="relative w-full max-w-md login-card-enter">
        {/* Back to home */}
        <div className="text-center mb-4">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/80 text-xs transition-colors">
            <ArrowLeft size={13} /> Back to Home
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 logo-glow border border-white/20 bg-white/10 backdrop-blur-md">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">CLMS</h1>
          <p className="text-white/60 mt-1 text-sm tracking-widest uppercase">College Leave Management</p>
        </div>

        {/* Glass card */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-white/10 rounded-2xl p-1 mb-6 gap-1">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 capitalize ${
                  mode === m
                    ? 'bg-white text-slate-800 shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {error && <Alert type="error" message={error} />}

            {mode === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="glass-label">First Name *</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                      <input className="glass-input pl-9" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="John" required />
                    </div>
                  </div>
                  <div>
                    <label className="glass-label">Last Name</label>
                    <input className="glass-input" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <label className="glass-label">Phone</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input className="glass-input pl-9" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div>
                  <label className="glass-label">Role</label>
                  <select className="glass-input" value={form.role} onChange={e => set('role', e.target.value)}>
                    <option value="student">Student</option>
                    <option value="hod">HOD</option>
                    <option value="principal">Principal</option>
                  </select>
                </div>
                {(form.role === 'student' || form.role === 'hod') && (
                  <div>
                    <label className="glass-label">Department</label>
                    <select className="glass-input" value={form.departmentId} onChange={e => onDeptChange(e.target.value)}>
                      <option value="">Select department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                )}
                {form.role === 'student' && sections.length > 0 && (
                  <div>
                    <label className="glass-label">Section</label>
                    <select className="glass-input" value={form.sectionId} onChange={e => set('sectionId', e.target.value)}>
                      <option value="">Select section</option>
                      {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="glass-label">Email Address *</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input className="glass-input pl-9" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@college.edu" required />
              </div>
            </div>

            <div>
              <label className="glass-label">Password *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input className="glass-input pl-9 pr-10" type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required minLength={6} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 btn-glow"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>

        </div>
      </div>
    </div>
  )
}
