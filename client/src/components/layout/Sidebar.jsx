import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, CheckSquare, Users, Building2,
  Bell, Settings, LogOut, GraduationCap, Menu, X, ListChecks, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = {
  student: [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/apply', icon: FileText, label: 'Apply' },
    { to: '/app/my-leaves', icon: ListChecks, label: 'My Leaves' },
    { to: '/app/notifications', icon: Bell, label: 'Alerts' },
    { to: '/app/settings', icon: Settings, label: 'Settings' },
  ],
  hod: [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/approvals', icon: CheckSquare, label: 'Approvals' },
    { to: '/app/my-leaves', icon: ListChecks, label: 'All Leaves' },
    { to: '/app/notifications', icon: Bell, label: 'Alerts' },
    { to: '/app/settings', icon: Settings, label: 'Settings' },
  ],
  principal: [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/approvals', icon: CheckSquare, label: 'Approvals' },
    { to: '/app/my-leaves', icon: ListChecks, label: 'All Leaves' },
    { to: '/app/notifications', icon: Bell, label: 'Alerts' },
    { to: '/app/settings', icon: Settings, label: 'Settings' },
  ],
  admin: [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/approvals', icon: CheckSquare, label: 'Leaves' },
    { to: '/app/users', icon: Users, label: 'Users' },
    { to: '/app/departments', icon: Building2, label: 'Depts' },
    { to: '/app/notifications', icon: Bell, label: 'Alerts' },
  ],
}

export default function Sidebar({ unreadCount = 0 }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const links = NAV[user?.role] || NAV.student

  function handleLogout() { logout(); navigate('/') }

  // ── Desktop Sidebar Content ────────────────────────────────────────────
  const SidebarContent = ({ mini }) => (
    <div className="flex flex-col h-full">
      {/* Logo + collapse toggle */}
      <div className={`flex items-center border-b border-white/10 ${mini ? 'justify-center px-3 py-4' : 'px-4 py-4 gap-3'}`}>
        {!mini && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 16px rgba(99,102,241,0.5)' }}>
              <img src="/logo.jpg" alt="logo" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
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
            <img src="/logo.jpg" alt="logo" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
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
            title={mini ? label : undefined}
            className={({ isActive }) =>
              `sidebar-nav-item relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${mini ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'} ${isActive
                ? 'sidebar-active-glow text-white shadow-xl'
                : 'text-white/50 hover:text-white/90 hover:bg-white/5'
              }`
            }
          >
            <Icon size={17} className="flex-shrink-0" />
            {!mini && <span className="flex-1">{label}</span>}
            {!mini && label === 'Alerts' && unreadCount > 0 && (
              <span className="text-xs font-bold w-5 h-5 flex items-center justify-center text-white bg-red-500 rounded-full shadow-md">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            {mini && label === 'Alerts' && unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 shadow-md" />
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
      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="mobile-bottom-nav lg:hidden">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `mobile-bottom-nav-item ${isActive ? 'mobile-bottom-nav-item--active' : ''}`
            }
          >
            <div className="mobile-bottom-nav-icon-wrap">
              <Icon size={20} />
              {label === 'Alerts' && unreadCount > 0 && (
                <span className="mobile-bottom-nav-badge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="mobile-bottom-nav-label">{label}</span>
          </NavLink>
        ))}

        {/* Logout at end */}
        <button onClick={handleLogout} className="mobile-bottom-nav-item mobile-bottom-nav-item--logout">
          <div className="mobile-bottom-nav-icon-wrap">
            <LogOut size={20} />
          </div>
          <span className="mobile-bottom-nav-label">Logout</span>
        </button>
      </nav>

      {/* ── Desktop Sidebar — collapsible ── */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0 transition-all duration-300 sidebar-glass ${collapsed ? 'w-16' : 'w-64'}`}
      >
        <SidebarContent mini={collapsed} />
      </aside>
    </>
  )
}
