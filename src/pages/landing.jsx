import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check, Box, Zap, Layers, Share2, GitBranch,
  FileText, Play, ChevronRight, Menu, X,
  Globe, Lock, RefreshCw, Download, Star, ArrowRight
} from 'lucide-react';
import { getSession } from '../auth';

const NAV_LINKS = ['Features', 'How It Works', 'Pricing', 'Docs'];

const FEATURES = [
  { icon: <Box size={28} />, title: 'Parametric Modeling', desc: 'Build precise 3D models with fully parametric constraints. Edit any dimension at any stage without rebuilding.' },
  { icon: <Zap size={28} />, title: 'Real-time Boolean Ops', desc: 'Subtract, union, and intersect solids instantly. See results live as you adjust parameters.' },
  { icon: <Layers size={28} />, title: 'Extrude, Revolve & Sweep', desc: 'Full suite of sketch-based operations. Turn any 2D profile into a complex 3D solid in seconds.' },
  { icon: <Share2 size={28} />, title: 'Cloud Sharing', desc: 'Share a live view link with anyone. Collaborators can inspect your model in the browser — no install needed.' },
  { icon: <Globe size={28} />, title: 'Browser-Native', desc: 'Runs entirely in the browser using React and Three.js. No plugins, no downloads, no friction.' },
  { icon: <Lock size={28} />, title: 'Private Projects', desc: 'Keep your designs private or publish them to the community. Full access control on every project.' },
  { icon: <RefreshCw size={28} />, title: 'Version History', desc: 'Every save is versioned. Roll back to any previous state of your model with a single click.' },
  { icon: <Download size={28} />, title: 'Export Anywhere', desc: 'Export to STL, OBJ, STEP, and GLTF. Ready for 3D printing, game engines, or CAM workflows.' },
];

const STEPS = [
  { num: '01', title: 'Create a Project', desc: 'Start from scratch or pick a template. Your project is saved to the cloud instantly.' },
  { num: '02', title: 'Sketch & Model', desc: 'Draw 2D profiles on any plane, then extrude, revolve, or sweep them into 3D solids.' },
  { num: '03', title: 'Refine & Collaborate', desc: 'Adjust parameters, apply boolean operations, and invite teammates to review in real time.' },
  { num: '04', title: 'Export & Ship', desc: 'Download your model in any format or share a live link directly from your dashboard.' },
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Perfect for hobbyists and students.',
    features: ['3 active projects', '500 MB storage', 'STL & OBJ export', 'Community support'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    desc: 'For professionals who need more power.',
    features: ['Unlimited projects', '20 GB storage', 'All export formats', 'Version history', 'Priority support', 'Private projects'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Team',
    price: '$49',
    period: 'per month',
    desc: 'Built for design teams and studios.',
    features: ['Everything in Pro', 'Up to 10 seats', '100 GB storage', 'Team dashboard', 'SSO & access control', 'Dedicated support'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const STATS = [
  { value: '12K+', label: 'Active Users' },
  { value: '340K+', label: 'Models Created' },
  { value: '98%', label: 'Uptime SLA' },
  { value: '4.9★', label: 'User Rating' },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const session = getSession();
  const ctaPath = session ? '/projects' : '/register';

  return (
    <div className="min-h-screen font-sans" style={{ background: '#0a0f1e', color: '#e2e8f0' }}>

      {/* ── HEADER ── */}
      <header style={{ background: 'rgba(10,15,30,0.85)', borderBottom: '1px solid rgba(99,179,237,0.12)' }}
        className="sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#63b3ed,#4299e1)' }}>
              <Box size={16} color="#fff" />
            </div>
            <span className="text-xl font-extrabold tracking-tight" style={{ color: '#f0f4f8' }}>
              3D<span style={{ color: '#63b3ed' }}>CAD</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`}
                className="text-sm font-medium transition-colors"
                style={{ color: '#94a3b8' }}
                onMouseEnter={e => e.target.style.color = '#63b3ed'}
                onMouseLeave={e => e.target.style.color = '#94a3b8'}>
                {l}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <Link to="/projects" className="text-sm font-semibold px-5 py-2 rounded-full transition-all"
                style={{ background: 'linear-gradient(135deg,#4299e1,#3182ce)', color: '#fff' }}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  style={{ color: '#94a3b8' }}>
                  Log in
                </Link>
                <Link to="/register"
                  className="text-sm font-semibold px-5 py-2 rounded-full transition-all"
                  style={{ background: 'linear-gradient(135deg,#4299e1,#3182ce)', color: '#fff' }}>
                  Start for Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ color: '#94a3b8' }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden px-6 pb-4 flex flex-col gap-4" style={{ borderTop: '1px solid rgba(99,179,237,0.1)' }}>
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`}
                className="text-sm font-medium" style={{ color: '#94a3b8' }}
                onClick={() => setMenuOpen(false)}>{l}</a>
            ))}
            {session ? (
              <Link to="/projects" className="text-sm font-semibold px-5 py-2 rounded-full text-center"
                style={{ background: 'linear-gradient(135deg,#4299e1,#3182ce)', color: '#fff' }}
                onClick={() => setMenuOpen(false)}>Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium" style={{ color: '#94a3b8' }} onClick={() => setMenuOpen(false)}>Log in</Link>
                <Link to="/register" className="text-sm font-semibold px-5 py-2 rounded-full text-center"
                  style={{ background: 'linear-gradient(135deg,#4299e1,#3182ce)', color: '#fff' }}
                  onClick={() => setMenuOpen(false)}>Start for Free</Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle,rgba(66,153,225,0.15),transparent 70%)' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle,rgba(99,179,237,0.1),transparent 70%)' }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'linear-gradient(rgba(99,179,237,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(99,179,237,0.3) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-16 flex flex-col lg:flex-row items-center gap-16">

          {/* Left */}
          <div className="flex-1 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6"
              style={{ background: 'rgba(66,153,225,0.15)', color: '#63b3ed', border: '1px solid rgba(99,179,237,0.3)' }}>
              <Zap size={12} /> Now with real-time collaboration
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6" style={{ color: '#f0f4f8' }}>
              Professional 3D CAD<br />
              <span style={{ background: 'linear-gradient(90deg,#63b3ed,#90cdf4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                in your browser
              </span>
            </h1>

            <p className="text-lg mb-8 leading-relaxed" style={{ color: '#94a3b8' }}>
              3DCAD is a full-featured parametric modeler built with React and Three.js.
              Design, collaborate, and export — all without leaving your browser.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link to={ctaPath}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all"
                style={{ background: 'linear-gradient(135deg,#4299e1,#3182ce)', color: '#fff' }}>
                {session ? 'Go to Dashboard' : 'Start Modeling Free'} <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works"
                className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all"
                style={{ border: '1px solid rgba(99,179,237,0.4)', color: '#63b3ed' }}>
                <Play size={16} /> Watch Demo
              </a>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-8">
              {STATS.map(s => (
                <div key={s.label}>
                  <div className="text-2xl font-extrabold" style={{ color: '#63b3ed' }}>{s.value}</div>
                  <div className="text-xs" style={{ color: '#64748b' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Video Mockup */}
          <div className="flex-1 w-full relative">
            {/* Main window */}
            <div className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ border: '1px solid rgba(99,179,237,0.2)', background: '#111827', boxShadow: '0 0 60px rgba(66,153,225,0.15)' }}>
              {/* Title bar */}
              <div className="flex items-center justify-between px-4 py-3"
                style={{ background: '#1e293b', borderBottom: '1px solid rgba(99,179,237,0.1)' }}>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs font-medium" style={{ color: '#64748b' }}>3DCAD Studio — project_alpha.3dc</span>
                <div className="w-12" />
              </div>
              {/* Video */}
              <div className="relative">
                <video src="/src/assets/3d.mp4" autoPlay loop muted playsInline
                  className="w-full block" style={{ maxHeight: '380px', objectFit: 'cover' }} />
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(180deg, rgba(8,12,28,0.45) 0%, rgba(8,12,28,0.15) 40%, rgba(8,12,28,0.15) 60%, rgba(8,12,28,0.55) 100%)' }} />
              </div>
            </div>

            {/* Floating second video card */}
            <div className="absolute -bottom-6 -left-6 rounded-2xl overflow-hidden shadow-2xl"
              style={{ width: '200px', border: '1px solid rgba(99,179,237,0.3)', background: '#1e293b', boxShadow: '0 0 30px rgba(66,153,225,0.15)' }}>
              <div className="flex items-center justify-between px-3 py-2"
                style={{ background: '#0f172a', borderBottom: '1px solid rgba(99,179,237,0.1)' }}>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <span className="text-[10px] font-medium" style={{ color: '#475569' }}>Preview</span>
                <div className="w-8" />
              </div>
              <div className="relative">
                <video src="/src/assets/3d2.mp4" autoPlay loop muted playsInline
                  className="w-full block" style={{ height: '140px', objectFit: 'cover' }} />
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(180deg, rgba(8,12,28,0.5) 0%, rgba(8,12,28,0.1) 50%, rgba(8,12,28,0.5) 100%)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(66,153,225,0.1)', color: '#63b3ed', border: '1px solid rgba(99,179,237,0.2)' }}>
              Everything you need
            </div>
            <h2 className="text-4xl font-extrabold mb-4" style={{ color: '#f0f4f8' }}>
              Built for serious designers
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#64748b' }}>
              Every tool you'd expect from a desktop CAD app — delivered in a fast, collaborative browser experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(f => (
              <div key={f.title}
                className="rounded-2xl p-6 transition-all duration-300 group cursor-default"
                style={{ background: '#111827', border: '1px solid rgba(99,179,237,0.1)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,179,237,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99,179,237,0.1)'}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(66,153,225,0.12)', color: '#63b3ed' }}>
                  {f.icon}
                </div>
                <h3 className="font-bold mb-2" style={{ color: '#f0f4f8' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6"
        style={{ background: '#080d1a' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(66,153,225,0.1)', color: '#63b3ed', border: '1px solid rgba(99,179,237,0.2)' }}>
              Simple workflow
            </div>
            <h2 className="text-4xl font-extrabold mb-4" style={{ color: '#f0f4f8' }}>
              From idea to export in minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px z-0"
                    style={{ background: 'linear-gradient(90deg,rgba(99,179,237,0.4),transparent)' }} />
                )}
                <div className="relative z-10">
                  <div className="text-4xl font-extrabold mb-4" style={{ color: 'rgba(99,179,237,0.2)' }}>{s.num}</div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: '#f0f4f8' }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(66,153,225,0.1)', color: '#63b3ed', border: '1px solid rgba(99,179,237,0.2)' }}>
              Transparent pricing
            </div>
            <h2 className="text-4xl font-extrabold mb-4" style={{ color: '#f0f4f8' }}>
              Plans for every scale
            </h2>
            <p className="text-lg" style={{ color: '#64748b' }}>Start free. Upgrade when you need more.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {PLANS.map(p => (
              <div key={p.name}
                className="rounded-2xl p-8 flex flex-col"
                style={{
                  background: p.highlight ? 'linear-gradient(160deg,#1a2744,#0f1e3d)' : '#111827',
                  border: p.highlight ? '1px solid rgba(99,179,237,0.5)' : '1px solid rgba(99,179,237,0.1)',
                  boxShadow: p.highlight ? '0 0 40px rgba(66,153,225,0.2)' : 'none',
                  transform: p.highlight ? 'scale(1.04)' : 'scale(1)',
                }}>
                {p.highlight && (
                  <div className="text-xs font-bold px-3 py-1 rounded-full self-start mb-4"
                    style={{ background: 'rgba(66,153,225,0.2)', color: '#63b3ed' }}>
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-extrabold mb-1" style={{ color: '#f0f4f8' }}>{p.name}</h3>
                <p className="text-sm mb-4" style={{ color: '#64748b' }}>{p.desc}</p>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-extrabold" style={{ color: '#f0f4f8' }}>{p.price}</span>
                  <span className="text-sm mb-1" style={{ color: '#64748b' }}>/{p.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm" style={{ color: '#94a3b8' }}>
                      <Check size={16} style={{ color: '#63b3ed', flexShrink: 0 }} /> {f}
                    </li>
                  ))}
                </ul>
                <Link to={ctaPath}
                  className="text-center py-3 rounded-full font-semibold text-sm transition-all"
                  style={p.highlight
                    ? { background: 'linear-gradient(135deg,#4299e1,#3182ce)', color: '#fff' }
                    : { border: '1px solid rgba(99,179,237,0.3)', color: '#63b3ed' }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-6"
        style={{ background: 'linear-gradient(135deg,#0d1b35,#0a1628)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold mb-4" style={{ color: '#f0f4f8' }}>
            Ready to build something great?
          </h2>
          <p className="text-lg mb-8" style={{ color: '#64748b' }}>
            Join thousands of engineers and designers already using 3DCAD.
          </p>
          <Link to={ctaPath}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all"
            style={{ background: 'linear-gradient(135deg,#4299e1,#3182ce)', color: '#fff' }}>
            {session ? 'Go to Dashboard' : 'Get Started Free'} <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#060b16', borderTop: '1px solid rgba(99,179,237,0.1)' }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#63b3ed,#4299e1)' }}>
                  <Box size={16} color="#fff" />
                </div>
                <span className="text-xl font-extrabold" style={{ color: '#f0f4f8' }}>
                  3D<span style={{ color: '#63b3ed' }}>CAD</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#475569' }}>
                Professional parametric 3D modeling in your browser. Built with React & Three.js.
              </p>
              <div className="flex gap-3">
                {[GitBranch, Link, Play, Share2].map((Icon, i) => (
                  <a key={i} href="#"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: 'rgba(99,179,237,0.08)', color: '#475569' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#63b3ed'; e.currentTarget.style.background = 'rgba(99,179,237,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'rgba(99,179,237,0.08)'; }}>
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-bold mb-4" style={{ color: '#f0f4f8' }}>Product</h4>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'Changelog', 'Roadmap', 'Status'].map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm transition-colors" style={{ color: '#475569' }}
                      onMouseEnter={e => e.target.style.color = '#63b3ed'}
                      onMouseLeave={e => e.target.style.color = '#475569'}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Developers */}
            <div>
              <h4 className="text-sm font-bold mb-4" style={{ color: '#f0f4f8' }}>Developers</h4>
              <ul className="space-y-3">
                {['Documentation', 'API Reference', 'GitHub', 'Examples', 'Community'].map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm transition-colors" style={{ color: '#475569' }}
                      onMouseEnter={e => e.target.style.color = '#63b3ed'}
                      onMouseLeave={e => e.target.style.color = '#475569'}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-bold mb-4" style={{ color: '#f0f4f8' }}>Company</h4>
              <ul className="space-y-3">
                {['About', 'Blog', 'Careers', 'Privacy Policy', 'Terms of Service'].map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm transition-colors" style={{ color: '#475569' }}
                      onMouseEnter={e => e.target.style.color = '#63b3ed'}
                      onMouseLeave={e => e.target.style.color = '#475569'}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4"
            style={{ borderTop: '1px solid rgba(99,179,237,0.08)' }}>
            <p className="text-xs" style={{ color: '#334155' }}>
              © {new Date().getFullYear()} 3DCAD. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs" style={{ color: '#334155' }}>
              <Star size={12} style={{ color: '#63b3ed' }} />
              Built with React & Three.js
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
