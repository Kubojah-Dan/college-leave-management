import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, CheckSquare, Users, Building2,
  Bell, Settings, LogOut, GraduationCap, Menu, X, ListChecks, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = {
  student: [
    { to: '/app/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/apply',         icon: FileText,         label: 'Apply Leave' },
    { to: '/app/my-leaves',     icon: ListChecks,       label: 'My Leaves' },
    { to: '/app/notifications', icon: Bell,             label: 'Notifications' },
    { to: '/app/settings',      icon: Settings,         label: 'Settings' },
  ],
  hod: [
    { to: '/app/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/approvals',     icon: CheckSquare,      label: 'Approvals' },
    { to: '/app/my-leaves',     icon: ListChecks,       label: 'All Leaves' },
    { to: '/app/notifications', icon: Bell,             label: 'Notifications' },
    { to: '/app/settings',      icon: Settings,         label: 'Settings' },
  ],
  principal: [
    { to: '/app/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/approvals',     icon: CheckSquare,      label: 'Approvals' },
    { to: '/app/my-leaves',     icon: ListChecks,       label: 'All Leaves' },
    { to: '/app/notifications', icon: Bell,             label: 'Notifications' },
    { to: '/app/settings',      icon: Settings,         label: 'Settings' },
  ],
  admin: [
    { to: '/app/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/approvals',     icon: CheckSquare,      label: 'All Leaves' },
    { to: '/app/users',         icon: Users,            label: 'Users' },
    { to: '/app/departments',   icon: Building2,        label: 'Departments' },
    { to: '/app/notifications', icon: Bell,             label: 'Notifications' },
    { to: '/app/settings',      icon: Settings,         label: 'Settings' },
  ],
}

const sidebarBg = {
  background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)',
  borderRight: '1px solid rgba(255,255,255,0.07)',
}

export default function Sidebar({ unreadCount = 0 }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const links = NAV[user?.role] || NAV.student

  function handleLogout() { logout(); navigate('/') }

  const SidebarContent = ({ mini }) => (
    <div className="flex flex-col h-full">
      {/* Logo + collapse toggle */}
      <div className={`flex items-center border-b border-white/10 ${mini ? 'justify-center px-3 py-4' : 'px-4 py-4 gap-3'}`}>
        {!mini && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 16px rgba(99,102,241,0.5)' }}>
              <img src="/logo.jpg" alt="logo" className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
              <GraduationCap size={20} className="text-white hidden" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-sm leading-tight tracking-wide">CLMS</p>
              <p className="text-xs text-white/40 truncate">Leave Management</p>
            </div>
          </div>
        )}
        {mini && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <img src="/logo.jpg" alt="logo" className="w-full h-full object-cover" onError={e => { e.target.style.display='none' }} />
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <Menu size={14} />}
        </button>
      </div>

      {/* User info */}
      {!mini && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden border border-white/20"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{user?.firstName?.[0]?.toUpperCase()}</div>
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-white/40 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      )}

      {mini && (
        <div className="flex justify-center py-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{user?.firstName?.[0]?.toUpperCase()}</div>
            }
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav className={`flex-1 py-3 space-y-0.5 overflow-y-auto ${mini ? 'px-2' : 'px-3'}`}>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            title={mini ? label : undefined}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${mini ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'} ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm border border-white/10'
                  : 'text-white/50 hover:bg-white/8 hover:text-white/90'
              }`
            }
          >
            <Icon size={17} className="flex-shrink-0" />
            {!mini && <span className="flex-1">{label}</span>}
            {!mini && label === 'Notifications' && unreadCount > 0 && (
              <span className="text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            {mini && label === 'Notifications' && unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className={`py-3 border-t border-white/10 ${mini ? 'px-2' : 'px-3'}`}>
        <button
          onClick={handleLogout}
          title={mini ? 'Sign Out' : undefined}
          className={`flex items-center gap-3 w-full rounded-xl text-sm font-medium text-white/50 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200 ${mini ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}`}
        >
          <LogOut size={17} />
          {!mini && 'Sign Out'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 rounded-xl shadow-lg border border-white/10"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-64 z-40 shadow-2xl transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={sidebarBg}
      >
        <SidebarContent mini={false} />
      </aside>

      {/* Desktop sidebar — collapsible */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}
        style={sidebarBg}
      >
        <SidebarContent mini={collapsed} />
      </aside>
    </>
  )
}
