import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, getSession } from '../auth';

const THEMES = [
  { video: '/src/assets/login/register/191159-889246512_medium.mp4', accent: '#63b3ed', accentHover: '#4299e1', border: 'rgba(99,179,237,0.15)', inputBorder: '#63b3ed', glow: 'rgba(99,179,237,0.12)', tag: 'Precision Modeling' },
  { video: '/src/assets/login/register/67358-521707474_medium.mp4', accent: '#9f7aea', accentHover: '#805ad5', border: 'rgba(159,122,234,0.15)', inputBorder: '#9f7aea', glow: 'rgba(159,122,234,0.12)', tag: 'Real-time Collaboration' },
  { video: '/src/assets/login/register/86462-593059278_medium.mp4', accent: '#68d391', accentHover: '#48bb78', border: 'rgba(104,211,145,0.15)', inputBorder: '#68d391', glow: 'rgba(104,211,145,0.12)', tag: 'Cloud-powered Design' },
];

const Logo = ({ accent, accentHover }) => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
      style={{ background: `linear-gradient(135deg,${accent},${accentHover})` }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    </div>
    <span className="text-lg font-extrabold tracking-tight text-white">
      3D<span style={{ color: accent }}>CAD</span>
    </span>
  </div>
);

export default function Login() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * THEMES.length));
  const theme = THEMES[index];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (getSession()) navigate('/projects', { replace: true });
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.75;
      videoRef.current.play();
    }
  }, [index]);

  const handleVideoEnd = () => setIndex(i => (i + 1) % THEMES.length);

  const inputBase = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderLeft: `3px solid ${theme.inputBorder}`,
    color: '#f0f4f8',
  };
  const onFocus = e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.borderLeftColor = theme.accent; };
  const onBlur  = e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderLeftColor = theme.inputBorder; };

  const handleSubmit = e => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setTimeout(() => {
      const result = loginUser({ email, password });
      setLoading(false);
      if (!result.ok) { setError(result.error); return; }
      navigate('/projects', { replace: true });
    }, 600);
  };

  return (
    <div className="flex min-h-screen font-sans" style={{ background: '#07090f' }}>

      {/* LEFT: Video */}
      <div className="hidden lg:flex relative flex-1 overflow-hidden">
        <video ref={videoRef} src={theme.video} autoPlay muted playsInline onEnded={handleVideoEnd} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right,rgba(7,9,15,0.1) 0%,rgba(7,9,15,0.7) 85%,rgba(7,9,15,1) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(7,9,15,0.7) 0%,transparent 50%)' }} />
        <div className="relative z-10 flex flex-col justify-between h-full p-10">
          <Logo accent={theme.accent} accentHover={theme.accentHover} />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: theme.glow, border: `1px solid ${theme.accent}44`, color: theme.accent }}>
              ✦ {theme.tag}
            </div>
            <h2 className="text-3xl font-extrabold text-white leading-snug mb-2">Design without<br />limits.</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Professional 3D CAD — entirely in your browser.</p>
          </div>
        </div>
      </div>

      {/* RIGHT: Form */}
      <div className="flex flex-col justify-center w-full lg:w-[480px] shrink-0 px-10 py-12 relative"
        style={{ background: '#07090f', borderLeft: `1px solid ${theme.border}` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle,${theme.glow} 0%,transparent 70%)` }} />

        <div className="relative z-10 w-full max-w-[360px] mx-auto">
          <div className="flex lg:hidden mb-10"><Logo accent={theme.accent} accentHover={theme.accentHover} /></div>

          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.35)' }}>Sign in to continue to your workspace</p>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4 text-sm"
              style={{ background: 'rgba(245,101,101,0.12)', border: '1px solid rgba(245,101,101,0.3)', color: '#fc8181' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Email address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full py-2.5 px-4 rounded-lg text-sm outline-none transition-all placeholder:text-slate-600"
                style={inputBase} onFocus={onFocus} onBlur={onBlur} required />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full py-2.5 px-4 rounded-lg text-sm outline-none transition-all placeholder:text-slate-600"
                style={inputBase} onFocus={onFocus} onBlur={onBlur} required />
            </div>

            <div className="flex items-center justify-between text-xs pt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: theme.accent }} />
                Keep me signed in
              </label>
              <a href="#" style={{ color: theme.accent }}>Forgot password?</a>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm text-white transition-all flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg,${theme.accent},${theme.accentHover})`, marginTop: '8px', opacity: loading ? 0.7 : 1 }}>
              {loading && <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {['GitHub', 'Google'].map(p => (
              <button key={p} className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                {p === 'GitHub'
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                }
                {p}
              </button>
            ))}
          </div>

          <p className="text-center text-xs mt-8" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold" style={{ color: theme.accent }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
