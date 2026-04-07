import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, CheckCircle, XCircle, Clock, Users, Building2,
  PlusCircle, ChevronRight, TrendingUp, BarChart2, Activity
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ComposedChart,
  LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { StatusBadge, PageLoader } from '../components/ui/index'

// ── Palette ─────────────────────────────────────────────────────────────────
const C = {
  indigo: '#6366f1', violet: '#8b5cf6', emerald: '#10b981',
  amber: '#f59e0b', blue: '#3b82f6', rose: '#f43f5e', cyan: '#06b6d4',
}
const STATUS_COLORS = {
  pending_hod: C.amber, pending_principal: C.blue,
  approved: C.emerald, rejected: C.rose, cancelled: '#94a3b8',
}

// ── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-xl px-4 py-3 shadow-2xl text-xs" style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
      {label && <p className="text-slate-800 font-bold mb-2 uppercase tracking-widest">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mt-1">
          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: p.color || p.fill }} />
          <p className="text-slate-600 font-semibold flex-1">
            {p.name}
          </p>
          <span className="text-slate-900 font-extrabold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Chart card wrapper ───────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`dashboard-glass-card rounded-2xl p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, from, to }) {
  return (
    <div className="stat-card-glass rounded-2xl p-5 text-white shadow-lg relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${from}dd, ${to}cc)` }}>
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="absolute -right-2 -bottom-6 w-28 h-28 rounded-full bg-white/5" />
      <div className="relative">
        <div className="icon-glass w-9 h-9 rounded-xl flex items-center justify-center mb-3">
          <Icon size={18} className="text-white" />
        </div>
        <p className="text-3xl font-extrabold">{value ?? '—'}</p>
        <p className="text-white/70 text-xs mt-1 font-medium">{label}</p>
      </div>
    </div>
  )
}

// ── Build monthly trend from leaves array ────────────────────────────────────
function buildMonthlyTrend(leaves) {
  const map = {}
  leaves.forEach(l => {
    const m = l.startDate?.slice(0, 7)
    if (!m) return
    if (!map[m]) map[m] = { month: m, approved: 0, rejected: 0, pending: 0 }
    if (l.status === 'approved') map[m].approved++
    else if (l.status === 'rejected') map[m].rejected++
    else map[m].pending++
  })
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-6).map(d => ({
    ...d, month: new Date(d.month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' })
  }))
}

// ── Build leave-type distribution ────────────────────────────────────────────
function buildTypeData(leaves) {
  const map = {}
  leaves.forEach(l => { map[l.leaveType] = (map[l.leaveType] || 0) + 1 })
  return Object.entries(map).map(([name, value]) => ({ name, value }))
}

// ── Build status pie data ─────────────────────────────────────────────────────
function buildStatusPie(stats) {
  return [
    { name: 'Approved',          value: stats?.approved || 0,          fill: C.emerald },
    { name: 'Pending HOD',       value: stats?.pending_hod || 0,       fill: C.amber },
    { name: 'Pending Principal', value: stats?.pending_principal || 0, fill: C.blue },
    { name: 'Rejected',          value: stats?.rejected || 0,          fill: C.rose },
  ].filter(d => d.value > 0)
}

// ── Student Dashboard ─────────────────────────────────────────────────────────
function StudentDashboard({ stats, leaves }) {
  const statusPie = buildStatusPie(stats)
  const monthlyTrend = buildMonthlyTrend(leaves)
  const typeData = buildTypeData(leaves)
  const radialData = [
    { name: 'Approved', value: stats?.approved || 0, fill: C.emerald },
    { name: 'Pending',  value: (stats?.pending_hod || 0) + (stats?.pending_principal || 0), fill: C.amber },
    { name: 'Rejected', value: stats?.rejected || 0, fill: C.rose },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Status Pie */}
        <ChartCard title="Leave Status Overview" subtitle="Distribution of all your requests">
          {statusPie.length === 0
            ? <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
            : <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {statusPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
          }
        </ChartCard>

        {/* Radial progress */}
        <ChartCard title="Leave Outcomes" subtitle="Visual breakdown by result">
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart cx="50%" cy="50%" innerRadius={30} outerRadius={90} data={radialData} startAngle={90} endAngle={-270}>
              <RadialBar minAngle={5} dataKey="value" cornerRadius={6} label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }} />
              <Tooltip content={<ChartTip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Monthly trend */}
      {monthlyTrend.length > 0 && (
        <ChartCard title="Monthly Leave Trend" subtitle="Your leave activity over the last 6 months">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.emerald} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.emerald} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.amber} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.amber} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="approved" stroke={C.emerald} fill="url(#gApproved)" strokeWidth={2} name="Approved" />
              <Area type="monotone" dataKey="pending"  stroke={C.amber}   fill="url(#gPending)"  strokeWidth={2} name="Pending" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Leave type bar */}
      {typeData.length > 0 && (
        <ChartCard title="Leave Types Applied" subtitle="How many of each type you've submitted">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={typeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]}>
                {typeData.map((_, i) => <Cell key={i} fill={[C.indigo, C.blue, C.cyan, C.violet, C.emerald][i % 5]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}

// ── HOD Dashboard ─────────────────────────────────────────────────────────────
function HodDashboard({ stats, leaves }) {
  const statusPie = buildStatusPie(stats)
  const monthlyTrend = buildMonthlyTrend(leaves)
  const typeData = buildTypeData(leaves)

  // Per-student leave count
  const studentMap = {}
  leaves.forEach(l => {
    const name = l.student ? `${l.student.firstName} ${l.student.lastName}` : 'Unknown'
    studentMap[name] = (studentMap[name] || 0) + 1
  })
  const studentData = Object.entries(studentMap)
    .map(([name, count]) => ({ name: name.split(' ')[0], count }))
    .sort((a, b) => b.count - a.count).slice(0, 8)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ChartCard title="Department Leave Status" subtitle="All requests in your department">
          {statusPie.length === 0
            ? <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
            : <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" outerRadius={85} paddingAngle={3} dataKey="value">
                    {statusPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
          }
        </ChartCard>

        <ChartCard title="Leave Types Distribution" subtitle="Types of leave in your department">
          {typeData.length === 0
            ? <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
            : <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                    {typeData.map((_, i) => <Cell key={i} fill={[C.indigo, C.blue, C.cyan, C.violet, C.emerald, C.amber][i % 6]} />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
          }
        </ChartCard>
      </div>

      {monthlyTrend.length > 0 && (
        <ChartCard title="Monthly Leave Trend" subtitle="Department leave activity over 6 months">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="approved" name="Approved" fill={C.emerald} radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="pending"  name="Pending"  fill={C.amber}   radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="rejected" name="Rejected" fill={C.rose}    radius={[4, 4, 0, 0]} stackId="a" />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {studentData.length > 0 && (
        <ChartCard title="Top Students by Leave Count" subtitle="Students with most leave applications">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={studentData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="count" name="Leaves" radius={[0, 6, 6, 0]}>
                {studentData.map((_, i) => <Cell key={i} fill={[C.indigo, C.blue, C.cyan, C.violet, C.emerald, C.amber, C.rose, C.cyan][i % 8]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}

// ── Admin / Principal Dashboard ───────────────────────────────────────────────
function AdminDashboard({ stats, leaves }) {
  const statusPie = buildStatusPie(stats)
  const monthlyTrend = buildMonthlyTrend(leaves)
  const typeData = buildTypeData(leaves)

  const deptMap = {}
  leaves.forEach(l => {
    const dept = l.student?.department?.name || 'Unknown'
    if (!deptMap[dept]) deptMap[dept] = { dept, approved: 0, rejected: 0, pending: 0 }
    if (l.status === 'approved') deptMap[dept].approved++
    else if (l.status === 'rejected') deptMap[dept].rejected++
    else deptMap[dept].pending++
  })
  const deptData = Object.values(deptMap).sort((a, b) => (b.approved + b.pending + b.rejected) - (a.approved + a.pending + a.rejected)).slice(0, 6)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ChartCard title="Institution-Wide Status" subtitle="All leave requests across the college">
          {statusPie.length === 0
            ? <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
            : <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {statusPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
          }
        </ChartCard>

        <ChartCard title="Leave Type Breakdown" subtitle="Most common leave types institution-wide">
          {typeData.length === 0
            ? <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
            : <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" outerRadius={85} paddingAngle={3} dataKey="value">
                    {typeData.map((_, i) => <Cell key={i} fill={[C.indigo, C.blue, C.cyan, C.violet, C.emerald, C.amber][i % 6]} />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
          }
        </ChartCard>
      </div>

      {monthlyTrend.length > 0 && (
        <ChartCard title="Monthly Leave Trend" subtitle="Institution-wide leave activity over 6 months">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="approved" stroke={C.emerald} strokeWidth={2.5} dot={{ r: 4, fill: C.emerald }} name="Approved" />
              <Line type="monotone" dataKey="pending"  stroke={C.amber}   strokeWidth={2.5} dot={{ r: 4, fill: C.amber }}   name="Pending" />
              <Line type="monotone" dataKey="rejected" stroke={C.rose}    strokeWidth={2.5} dot={{ r: 4, fill: C.rose }}    name="Rejected" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {deptData.length > 0 && (
        <ChartCard title="Leaves by Department" subtitle="Breakdown of leave requests per department">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dept" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="approved" name="Approved" fill={C.emerald} radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="pending"  name="Pending"  fill={C.amber}   radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="rejected" name="Rejected" fill={C.rose}    radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/leaves/stats'),
      api.get('/leaves'),
    ]).then(([s, l]) => {
      setStats(s.data)
      setLeaves(l.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const roleColors = { admin: '#6366f1', principal: '#0ea5e9', hod: '#10b981', student: '#f59e0b' }
  const roleColor = roleColors[user?.role] || '#6366f1'

  const statItems = [
    { label: 'Total Leaves',       value: stats?.total,             icon: FileText,    from: '#6366f1', to: '#8b5cf6' },
    { label: 'Approved',           value: stats?.approved,          icon: CheckCircle, from: '#10b981', to: '#059669' },
    { label: 'Pending HOD',        value: stats?.pending_hod,       icon: Clock,       from: '#f59e0b', to: '#d97706' },
    { label: 'Pending Principal',  value: stats?.pending_principal, icon: TrendingUp,  from: '#3b82f6', to: '#2563eb' },
  ]

  const recent = leaves.slice(0, 5)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ── Dashboard Header Banner ── */}
      <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #312e81 50%, #4c1d95 100%)' }}>
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${roleColor}, ${roleColor}66)` }} />
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 flex-shrink-0 shadow-xl"
              style={{ borderColor: `${roleColor}55`, background: `linear-gradient(135deg, ${roleColor}33, ${roleColor}11)` }}>
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">{user?.firstName?.[0]?.toUpperCase()}</div>
              }
            </div>
            <div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wider">{greeting()}</p>
              <h1 className="text-xl font-bold text-white mt-0.5">{user?.firstName} {user?.lastName}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white capitalize" style={{ background: roleColor, boxShadow: `0 0 12px ${roleColor}66` }}>
                  {user?.role}
                </span>
                {user?.department?.name && (
                  <span className="text-white/40 text-xs">{user.department.name}{user.section ? ` · ${user.section.name}` : ''}</span>
                )}
              </div>
            </div>
          </div>
          {user?.role === 'student' && (
            <Link to="/app/apply" className="btn-primary shadow-lg flex-shrink-0">
              <PlusCircle size={16} /> Apply Leave
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map(p => <StatCard key={p.label} {...p} />)}
      </div>

      {/* Role-based charts */}
      {user?.role === 'student' && <StudentDashboard stats={stats} leaves={leaves} />}
      {user?.role === 'hod'     && <HodDashboard     stats={stats} leaves={leaves} />}
      {['admin', 'principal'].includes(user?.role) && <AdminDashboard stats={stats} leaves={leaves} />}

      {/* Recent Leaves */}
      <div className="dashboard-glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Recent Leave Requests</h2>
              <p className="text-xs text-slate-500">Latest activity across the system</p>
            </div>
          </div>
          <Link
            to={user?.role === 'student' ? '/app/my-leaves' : '/app/approvals'}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 font-semibold"
          >
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText size={36} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No leave requests yet</p>
            {user?.role === 'student' && (
              <Link to="/app/apply" className="btn-primary mt-4 inline-flex">Apply for Leave</Link>
            )}
          </div>
        ) : (
          <div className="table-modern-wrapper">
            <table className="table-modern">
              <thead>
                <tr>
                  {['admin', 'hod', 'principal'].includes(user?.role) && <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-purple-500">Student</th>}
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-purple-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-purple-500">From</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-purple-500">To</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-purple-500">Days</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-purple-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map(l => (
                  <tr key={l.id} className="hover:bg-indigo-50/30 transition-all duration-200">
                    {['admin', 'hod', 'principal'].includes(user?.role) && (
                      <td className="px-4 py-3 text-slate-700 text-sm font-semibold">{l.student?.firstName} {l.student?.lastName}</td>
                    )}
                    <td className="px-4 py-3 text-slate-600 text-sm">{l.leaveType}</td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{l.startDate}</td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{l.endDate}</td>
                    <td className="px-4 py-3 text-slate-600 text-sm"><span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold">{l.totalDays}d</span></td>
                    <td className="px-4 py-3 text-slate-600 text-sm"><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin quick links */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/app/users" className="dashboard-glass-card rounded-2xl p-5 flex items-center gap-4 group">
            <div className="icon-glass w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
              <Users size={22} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Manage Users</p>
              <p className="text-sm text-slate-500">Add, edit or deactivate users</p>
            </div>
            <ChevronRight size={18} className="text-slate-400 ml-auto group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/app/departments" className="dashboard-glass-card rounded-2xl p-5 flex items-center gap-4 group">
            <div className="icon-glass w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#06b6d4,#0891b2)' }}>
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Departments</p>
              <p className="text-sm text-slate-500">Manage departments & sections</p>
            </div>
            <ChevronRight size={18} className="text-slate-400 ml-auto group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  )
}
