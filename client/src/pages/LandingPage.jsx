import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, FileText, CheckCircle, Clock, Bell, Shield,
  Users, Building2, ChevronRight, ArrowRight, Star, Menu, X,
  BookOpen, Award, Zap, BarChart2, Lock, Smartphone
} from 'lucide-react'

// ── Counter animation hook ──────────────────────────────────────────────────
function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

// ── Intersection observer hook ──────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

// ── Stat counter card ───────────────────────────────────────────────────────
function StatCounter({ value, suffix = '', label, inView }) {
  const count = useCounter(value, 1800, inView)
  return (
    <div className="text-center">
      <p className="text-4xl font-extrabold text-white">{count}{suffix}</p>
      <p className="text-blue-200 text-sm mt-1 font-medium">{label}</p>
    </div>
  )
}

// ── Feature card ────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color, delay }) {
  const [ref, inView] = useInView(0.1)
  return (
    <div
      ref={ref}
      className="landing-feature-card"
      style={{ transitionDelay: `${delay}ms`, opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(32px)' }}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 flex-shrink-0" style={{ background: color }}>
        <Icon size={22} className="text-white" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

// ── Role card ───────────────────────────────────────────────────────────────
function RoleCard({ icon: Icon, role, desc, color, items, delay }) {
  const [ref, inView] = useInView(0.1)
  const [hovered, setHovered] = useState(false)
  return (
    <div
      ref={ref}
      className="landing-role-card"
      style={{ transitionDelay: `${delay}ms`, opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(32px)', borderColor: hovered ? color : 'rgba(255,255,255,0.08)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${color}22`, border: `1.5px solid ${color}55` }}>
        <Icon size={26} style={{ color }} />
      </div>
      <h3 className="text-xl font-bold text-white mb-1">{role}</h3>
      <p className="text-slate-400 text-sm mb-4">{desc}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
            <CheckCircle size={14} style={{ color }} className="flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Step card ───────────────────────────────────────────────────────────────
function StepCard({ num, title, desc, color, delay }) {
  const [ref, inView] = useInView(0.1)
  return (
    <div
      ref={ref}
      className="flex gap-4 items-start"
      style={{ transition: 'all 0.6s ease', transitionDelay: `${delay}ms`, opacity: inView ? 1 : 0, transform: inView ? 'translateX(0)' : 'translateX(-24px)' }}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 mt-1" style={{ background: color }}>
        {num}
      </div>
      <div>
        <h4 className="font-bold text-white mb-1">{title}</h4>
        <p className="text-slate-400 text-sm">{desc}</p>
      </div>
    </div>
  )
}

// ── Main Landing Page ───────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [statsRef, statsInView] = useInView(0.3)
  const [liveStats, setLiveStats] = useState({ students: 0, departments: 0, leaves: 0 })

  useEffect(() => {
    const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    fetch(`${BASE.replace('/api', '')}/api/public/stats`)
      .then(r => r.json())
      .then(d => setLiveStats(d))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const features = [
    { icon: FileText,   title: 'Digital Leave Applications',  desc: 'Submit leave requests online with supporting documents — no paperwork needed.',          color: 'linear-gradient(135deg,#6366f1,#8b5cf6)', delay: 0 },
    { icon: CheckCircle,title: 'Multi-Level Approvals',       desc: 'Structured HOD → Principal workflow ensures every request is reviewed properly.',         color: 'linear-gradient(135deg,#10b981,#059669)', delay: 100 },
    { icon: Bell,       title: 'Real-Time Notifications',     desc: 'Instant alerts via email and in-app notifications keep everyone in the loop.',             color: 'linear-gradient(135deg,#f59e0b,#d97706)', delay: 200 },
    { icon: BarChart2,  title: 'Analytics & Reports',         desc: 'Visual dashboards give insights into leave trends, department stats, and more.',            color: 'linear-gradient(135deg,#3b82f6,#2563eb)', delay: 300 },
    { icon: Shield,     title: 'Role-Based Access',           desc: 'Secure, role-specific views for students, HODs, principals, and administrators.',          color: 'linear-gradient(135deg,#ec4899,#db2777)', delay: 400 },
    { icon: Smartphone, title: 'Mobile Friendly',             desc: 'Fully responsive design works seamlessly on phones, tablets, and desktops.',               color: 'linear-gradient(135deg,#06b6d4,#0891b2)', delay: 500 },
  ]

  const roles = [
    {
      icon: GraduationCap, role: 'Student', color: '#6366f1', delay: 0,
      desc: 'Apply and track your leave requests with ease.',
      items: ['Submit leave applications', 'Upload supporting documents', 'Track approval status', 'View leave history & analytics'],
    },
    {
      icon: Users, role: 'HOD / Faculty', color: '#10b981', delay: 150,
      desc: 'Manage department leave requests efficiently.',
      items: ['Review student applications', 'Approve or reject with remarks', 'Monitor department leave trends', 'Forward to Principal'],
    },
    {
      icon: Award, role: 'Principal', color: '#f59e0b', delay: 300,
      desc: 'Final authority on all leave approvals.',
      items: ['Final approval authority', 'Institution-wide overview', 'Analytics across departments', 'Generate reports'],
    },
    {
      icon: Shield, role: 'Admin', color: '#ec4899', delay: 450,
      desc: 'Full system control and user management.',
      items: ['Manage users & roles', 'Configure departments', 'System-wide analytics', 'Override any request'],
    },
  ]

  const steps = [
    { num: '01', title: 'Register & Login',       desc: 'Create your account with your college email and select your role.',                    color: '#6366f1', delay: 0 },
    { num: '02', title: 'Submit Leave Request',   desc: 'Fill in dates, reason, and attach any required documents digitally.',                  color: '#3b82f6', delay: 100 },
    { num: '03', title: 'HOD Reviews',            desc: 'Your department HOD reviews and either approves or rejects with remarks.',              color: '#10b981', delay: 200 },
    { num: '04', title: 'Principal Approves',     desc: 'Approved requests are forwarded to the Principal for final sign-off.',                  color: '#f59e0b', delay: 300 },
    { num: '05', title: 'Instant Notification',   desc: 'You receive real-time email and in-app notifications at every step.',                   color: '#ec4899', delay: 400 },
  ]

  return (
    <div className="landing-root">
      {/* ── Navbar ── */}
      <nav className={`landing-nav ${scrolled ? 'landing-nav-scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <span className="text-white font-extrabold text-lg leading-none">CLMS</span>
              <span className="block text-blue-300 text-xs font-medium">Sri Eshwar College</span>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {['features', 'about', 'roles', 'how-it-works'].map(id => (
              <button key={id} onClick={() => scrollTo(id)} className="text-slate-300 hover:text-white text-sm font-medium transition-colors capitalize">
                {id.replace(/-/g, ' ')}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="landing-btn-outline">Sign In</button>
            <button onClick={() => navigate('/login?tab=register')} className="landing-btn-primary">
              Get Started <ArrowRight size={15} />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden text-white p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden landing-mobile-menu">
            {['features', 'about', 'roles', 'how-it-works'].map(id => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 text-sm font-medium capitalize transition-colors">
                {id.replace(/-/g, ' ')}
              </button>
            ))}
            <div className="flex gap-3 p-4 border-t border-white/10">
              <button onClick={() => navigate('/login')} className="flex-1 landing-btn-outline text-center">Sign In</button>
              <button onClick={() => navigate('/login?tab=register')} className="flex-1 landing-btn-primary justify-center">Register</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-bg" style={{ backgroundImage: 'url(/EshwarCollege1.jpg)' }} />
        <div className="landing-hero-overlay" />
        {/* Animated orbs */}
        <div className="landing-orb landing-orb-1" />
        <div className="landing-orb landing-orb-2" />
        <div className="landing-orb landing-orb-3" />

        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <Star size={12} className="text-yellow-400" />
            <span>Smart Leave Management System</span>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <img src="/logo.jpg" alt="Logo" className="w-20 h-20 rounded-2xl object-cover drop-shadow-2xl" />
          </div>

          <h1 className="landing-hero-title">
            Eshwar College of<br />
            <span className="landing-hero-gradient">Engineering</span>
          </h1>
          <p className="landing-hero-subtitle">
            Smart Leave Management for Students &amp; Faculty
          </p>
          <p className="landing-hero-desc">
            A fully digital, multi-level leave approval system that eliminates paperwork,
            speeds up approvals, and keeps everyone informed in real time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button onClick={() => navigate('/login')} className="landing-btn-hero-primary">
              <Lock size={18} /> Sign In to Dashboard
            </button>
            <button onClick={() => navigate('/login?tab=register')} className="landing-btn-hero-outline">
              Create Account <ChevronRight size={18} />
            </button>
          </div>

          {/* Quick role pills — click to login */}
          <div className="flex flex-wrap gap-2 justify-center mt-8">
            {['Student', 'HOD / Faculty', 'Principal', 'Admin'].map((r, i) => (
              <button key={i} onClick={() => navigate('/login')} className="landing-role-pill">{r}</button>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="landing-scroll-indicator" onClick={() => scrollTo('features')}>
          <div className="landing-scroll-dot" />
        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section ref={statsRef} className="landing-stats-banner">
        <div className="landing-section-inner grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCounter value={liveStats.students}    suffix="" label="Students Enrolled" inView={statsInView} />
          <StatCounter value={liveStats.departments} suffix="" label="Departments"        inView={statsInView} />
          <StatCounter value={liveStats.leaves}      suffix="" label="Leaves Processed"   inView={statsInView} />
          <StatCounter value={99}                    suffix="%" label="Approval Accuracy"  inView={statsInView} />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="landing-section landing-section-muted">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-tag">Features</span>
            <h2 className="landing-section-title">Everything you need, nothing you don't</h2>
            <p className="landing-section-desc">Built for colleges that want to modernize their leave management without complexity.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => <FeatureCard key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="landing-section landing-section-alt landing-section-muted">
        <div className="landing-section-inner">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="landing-section-tag">About the System</span>
              <h2 className="landing-section-title text-left mt-3">What is CLMS?</h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                The <strong className="text-white">College Leave Management System (CLMS)</strong> is a modern, fully digital platform
                designed to replace manual leave processes at Eshwar College of Engineering.
              </p>
              <p className="text-slate-400 leading-relaxed mb-6">
                Students can apply for leave digitally, faculty can approve or reject requests with remarks,
                and the Principal has final authority — all with real-time notifications at every step.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Zap,       text: 'Instant multi-level approval workflow' },
                  { icon: BookOpen,  text: 'Complete leave history and audit trail' },
                  { icon: BarChart2, text: 'Visual analytics for data-driven decisions' },
                  { icon: Lock,      text: 'Secure role-based access control' },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon size={15} className="text-blue-400" />
                    </div>
                    <span className="text-slate-300 text-sm">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img src="/EshwarCollege1.jpg" alt="Eshwar College" className="rounded-2xl w-full object-cover h-80 shadow-2xl" />
              <div className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(30,58,138,0.4), rgba(99,102,241,0.2))' }} />
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <p className="text-white font-bold text-sm">Eshwar College of Engineering</p>
                <p className="text-blue-300 text-xs mt-0.5">Empowering students with digital solutions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section id="roles" className="landing-section landing-section-muted">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-tag">Who Can Use It</span>
            <h2 className="landing-section-title">Built for every role</h2>
            <p className="landing-section-desc">Each user gets a tailored experience with the tools and views they need.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {roles.map((r, i) => <RoleCard key={i} {...r} />)}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="landing-section landing-section-alt landing-section-muted">
        <div className="landing-section-inner">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="landing-section-tag">How It Works</span>
              <h2 className="landing-section-title text-left mt-3">From request to approval in minutes</h2>
              <p className="text-slate-400 text-sm mb-8">A streamlined 5-step process that keeps everyone informed.</p>
              <div className="space-y-6">
                {steps.map((s, i) => <StepCard key={i} {...s} />)}
              </div>
            </div>
            {/* Visual flow diagram */}
            <div className="landing-flow-card">
              <div className="text-center mb-6">
                <p className="text-white font-bold text-lg">Leave Approval Flow</p>
                <p className="text-slate-400 text-xs mt-1">Real-time status at every stage</p>
              </div>
              {[
                { label: 'Student Submits',    color: '#6366f1', icon: GraduationCap },
                { label: 'HOD Reviews',        color: '#3b82f6', icon: Users },
                { label: 'Principal Approves', color: '#10b981', icon: Award },
                { label: 'Notification Sent',  color: '#f59e0b', icon: Bell },
              ].map(({ label, color, icon: Icon }, i, arr) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="flex items-center gap-3 w-full landing-flow-step" style={{ borderColor: `${color}44`, background: `${color}11` }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color }}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <span className="text-white text-sm font-medium">{label}</span>
                    <CheckCircle size={16} style={{ color }} className="ml-auto" />
                  </div>
                  {i < arr.length - 1 && (
                    <div className="w-0.5 h-5 my-1" style={{ background: `linear-gradient(${color}, ${arr[i+1].color})` }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta">
        <div className="landing-orb landing-orb-cta-1" />
        <div className="landing-orb landing-orb-cta-2" />
        <div className="landing-section-inner text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Ready to go paperless?
          </h2>
          <p className="text-blue-200 mb-8 max-w-xl mx-auto">
            Join Eshwar College's digital leave management platform today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/login?tab=register')} className="landing-btn-hero-primary">
              Register Now <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/login')} className="landing-btn-hero-outline">
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-section-inner">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
              <div>
                <p className="text-white font-bold text-sm">CLMS — Eshwar College of Engineering</p>
                <p className="text-slate-500 text-xs">College Leave Management System</p>
              </div>
            </div>
            <p className="text-slate-500 text-xs">© {new Date().getFullYear()} Eshwar College. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
