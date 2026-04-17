import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 3;
const LS_LOCK_KEY  = 'adminLockUntil';
const API_URL      = 'https://backend-games-phi.vercel.app';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');

  .lgw {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(-45deg, #0a0a1a, #12122a, #1a0f2e, #0d1a2e);
    background-size: 400% 400%;
    animation: lgwBG 18s ease infinite;
    padding: 20px;
    font-family: 'Outfit', 'Inter', sans-serif;
    position: relative;
  }

  .lgw::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(0,210,255,.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,210,255,.04) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  @keyframes lgwBG {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .lgw-card {
    position: relative;
    z-index: 1;
    background: rgba(255,255,255,.04);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 24px;
    padding: 44px 40px;
    width: 100%;
    max-width: 460px;
    box-shadow:
      0 8px 40px rgba(0,0,0,.8),
      0 0 30px rgba(0,210,255,.1),
      inset 0 1px 0 rgba(255,255,255,.06);
    animation: lgwIn 0.65s cubic-bezier(.22,1,.36,1) both;
    overflow: hidden;
  }

  .lgw-card::after {
    content: '';
    position: absolute;
    top: 0; left: -60%;
    width: 40%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.025), transparent);
    transform: skewX(-20deg);
    animation: lgwShimmer 7s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes lgwShimmer {
    0%   { left: -60%; }
    100% { left: 140%; }
  }

  @keyframes lgwIn {
    from { opacity: 0; transform: translateY(28px) scale(.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    }
  }

  /* ── Icon ── */
  .lgw-icon {
    font-size: 3rem;
    text-align: center;
    margin-bottom: 14px;
    background: linear-gradient(135deg, #00d2ff, #3a7bd5, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 14px rgba(0,210,255,.4));
    animation: lgwFloat 3s ease-in-out infinite;
  }

  @keyframes lgwFloat {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-6px); }
  }

  /* ── Labels/inputs ── */
  .lgw .form-label {
    color: #94a3b8 !important;
    font-weight: 600 !important;
    font-size: .78rem !important;
    text-transform: uppercase !important;
    letter-spacing: 1.5px !important;
    margin-bottom: 8px !important;
  }

  .lgw-input {
    background: rgba(0,0,0,.35) !important;
    border: 1px solid rgba(255,255,255,.1) !important;
    color: white !important;
    padding: 13px 17px !important;
    border-radius: 12px !important;
    transition: border-color .25s, box-shadow .25s !important;
    font-family: 'Outfit', sans-serif !important;
    font-size: .95rem !important;
  }

  .lgw-input::placeholder { color: rgba(255,255,255,.22) !important; }

  .lgw-input:focus {
    background: rgba(0,0,0,.5) !important;
    border-color: #00d2ff !important;
    box-shadow: 0 0 20px rgba(0,210,255,.25) !important;
    outline: none !important;
  }

  .lgw-input.input-error {
    border-color: #ef4444 !important;
    box-shadow: 0 0 12px rgba(239,68,68,.2) !important;
  }

  /* ── Primary button ── */
  .lgw-btn {
    background: linear-gradient(90deg, #00d2ff 0%, #3a7bd5 55%, #a855f7 100%) !important;
    border: none !important;
    padding: 14px !important;
    border-radius: 12px !important;
    font-weight: 800 !important;
    font-size: .84rem !important;
    text-transform: uppercase !important;
    letter-spacing: 2.5px !important;
    transition: box-shadow .3s, transform .2s !important;
    color: white !important;
    position: relative;
    overflow: hidden;
  }

  .lgw-btn:hover:not(:disabled) {
    box-shadow: 0 0 32px rgba(0,210,255,.5), 0 0 60px rgba(168,85,247,.18) !important;
    transform: translateY(-2px) !important;
  }

  .lgw-btn:active:not(:disabled) { transform: translateY(0) !important; }

  .lgw-btn:disabled { opacity: .55; cursor: not-allowed; }

  /* ── Error/success alert ── */
  .lgw-alert {
    border-radius: 12px;
    padding: 12px 16px;
    font-weight: 600;
    font-size: .87rem;
    line-height: 1.5;
    margin-bottom: 20px;
    animation: lgwIn .3s ease both;
  }

  .lgw-alert-error {
    background: rgba(239,68,68,.1);
    border: 1px solid rgba(239,68,68,.3);
    color: #fca5a5;
  }

  .lgw-alert-success {
    background: rgba(34,197,94,.1);
    border: 1px solid rgba(34,197,94,.35);
    color: #86efac;
  }

  /* ── Attempts badge ── */
  .lgw-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 10px;
    padding: 10px 14px;
    margin-top: 12px;
    font-size: .84rem;
    font-weight: 600;
    animation: lgwIn .3s ease both;
  }

  .lgw-badge-2 { background: rgba(234,179,8,.1);  border: 1px solid rgba(234,179,8,.4);  color: #fde047; }
  .lgw-badge-1 { background: rgba(249,115,22,.12); border: 1px solid rgba(249,115,22,.5); color: #fdba74; }
  .lgw-badge-0 { background: rgba(239,68,68,.12);  border: 1px solid rgba(239,68,68,.5);  color: #fca5a5; }

  /* ── Dot indicators ── */
  .lgw-dots { display: flex; gap: 6px; align-items: center; }
  .lgw-dot {
    width: 9px; height: 9px; border-radius: 50%;
    transition: background .3s;
  }
  .lgw-dot-on  { background: #ef4444; box-shadow: 0 0 5px rgba(239,68,68,.7); }
  .lgw-dot-off { background: rgba(255,255,255,.15); }

  /* ── Lock screen ── */
  .lgw-lock {
    text-align: center;
    animation: lgwIn .5s cubic-bezier(.22,1,.36,1) both;
  }

  .lgw-lock-ring {
    width: 88px; height: 88px; border-radius: 50%;
    background: rgba(239,68,68,.08);
    border: 2px solid rgba(239,68,68,.5);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 22px;
    animation: lgwPulse 2.2s ease-in-out infinite;
  }

  .lgw-lock-ring i {
    font-size: 2.2rem; color: #ef4444;
    filter: drop-shadow(0 0 10px rgba(239,68,68,.8));
  }

  @keyframes lgwPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,.4), 0 0 20px rgba(239,68,68,.15); }
    50%      { box-shadow: 0 0 0 14px rgba(239,68,68,0), 0 0 40px rgba(239,68,68,.3); }
  }

  .lgw-countdown-box {
    background: rgba(0,0,0,.4);
    border: 1px solid rgba(239,68,68,.25);
    border-radius: 16px;
    padding: 18px 24px;
    margin: 20px auto;
    max-width: 260px;
  }

  .lgw-countdown-label {
    color: #64748b;
    font-size: .72rem;
    text-transform: uppercase;
    letter-spacing: 2.5px;
    margin-bottom: 8px;
  }

  .lgw-countdown-timer {
    font-size: 2.6rem;
    font-weight: 900;
    letter-spacing: 4px;
    background: linear-gradient(90deg, #ef4444, #f97316);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-variant-numeric: tabular-nums;
    filter: drop-shadow(0 0 8px rgba(239,68,68,.4));
  }

  /* ── Divider ── */
  .lgw-divider {
    border: none;
    border-top: 1px solid rgba(255,255,255,.06);
    margin: 28px 0;
  }

  /* ── Link ── */
  .lgw-link {
    color: #00d2ff !important;
    text-decoration: none !important;
    font-weight: 700;
    font-size: .87rem;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: color .25s;
  }

  .lgw-link:hover { color: #a855f7 !important; }

  /* ── Logout outline btn ── */
  .lgw-outline-btn {
    background: transparent !important;
    border: 1px solid rgba(239,68,68,.45) !important;
    color: #fca5a5 !important;
    padding: 12px !important;
    border-radius: 12px !important;
    font-weight: 700 !important;
    font-size: .82rem !important;
    letter-spacing: 1.5px !important;
    text-transform: uppercase !important;
    transition: all .3s !important;
  }

  .lgw-outline-btn:hover {
    background: rgba(239,68,68,.1) !important;
    box-shadow: 0 0 18px rgba(239,68,68,.25) !important;
  }
`;

// ─── Helper ───────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');

// ─── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(lockUntil, onExpire) {
    const [remaining, setRemaining] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        if (!lockUntil) { setRemaining(0); return; }

        const tick = () => {
            const diff = new Date(lockUntil).getTime() - Date.now();
            if (diff <= 0) {
                setRemaining(0);
                clearInterval(ref.current);
                onExpire && onExpire();
            } else {
                setRemaining(diff);
            }
        };

        tick();
        ref.current = setInterval(tick, 1000);
        return () => clearInterval(ref.current);
    }, [lockUntil]); // eslint-disable-line

    const h = Math.floor(remaining / 3_600_000);
    const m = Math.floor((remaining % 3_600_000) / 60_000);
    const s = Math.floor((remaining % 60_000) / 1_000);
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// ─── Lock Screen ──────────────────────────────────────────────────────────────
const LockScreen = ({ lockUntil, onUnlocked }) => {
    const countdown = useCountdown(lockUntil, onUnlocked);

    return (
        <div className="lgw-lock">
            <div className="lgw-lock-ring">
                <i className="bi bi-shield-lock-fill" />
            </div>

            <h2 className="mb-1" style={{ color: 'white', fontWeight: 900, fontSize: '1.45rem' }}>
                ACCOUNT LOCKED
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '.87rem', lineHeight: 1.6, marginBottom: 4 }}>
                Too many consecutive failed login attempts.<br />
                Your account is temporarily suspended.
            </p>

            {/* All dots red — fully maxed out */}
            <div className="lgw-dots" style={{ justifyContent: 'center', margin: '16px 0 4px' }}>
                {[...Array(MAX_ATTEMPTS)].map((_, i) => (
                    <div key={i} className="lgw-dot lgw-dot-on" />
                ))}
            </div>

            <div className="lgw-countdown-box">
                <div className="lgw-countdown-label">Unlocks in</div>
                <div className="lgw-countdown-timer">{countdown}</div>
            </div>

            <p style={{ color: '#475569', fontSize: '.77rem', marginTop: 8 }}>
                The login form will automatically reappear when the timer expires.
            </p>
        </div>
    );
};

// ─── Attempts Badge ───────────────────────────────────────────────────────────
const AttemptsBadge = ({ attemptsLeft }) => {
    const cls  = attemptsLeft >= 2 ? 'lgw-badge-2' : attemptsLeft === 1 ? 'lgw-badge-1' : 'lgw-badge-0';
    const icon = attemptsLeft >= 2
        ? 'bi-exclamation-triangle-fill'
        : attemptsLeft === 1
            ? 'bi-exclamation-octagon-fill'
            : 'bi-x-octagon-fill';

    // dots: left = used (red), right = remaining (grey) — reversed perspective
    const usedCount = MAX_ATTEMPTS - attemptsLeft;

    return (
        <div className={`lgw-badge ${cls}`}>
            <i className={`bi ${icon}`} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>
                {attemptsLeft > 0
                    ? `${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left before 24-hour lock`
                    : 'Next failure will lock your account for 24 hours'}
            </span>
            <div className="lgw-dots" style={{ flexShrink: 0 }}>
                {[...Array(MAX_ATTEMPTS)].map((_, i) => (
                    <div key={i} className={`lgw-dot ${i < usedCount ? 'lgw-dot-on' : 'lgw-dot-off'}`} />
                ))}
            </div>
        </div>
    );
};

// ─── Main Login Component ─────────────────────────────────────────────────────
const Login = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [isLogin, setIsLogin]         = useState(true);
    const [formData, setFormData]       = useState({ username: '', password: '', confirmPassword: '' });
    const [error, setError]             = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading]         = useState(false);
    const [attemptsLeft, setAttemptsLeft] = useState(null);

    const [lockUntil, setLockUntil] = useState(() => {
        try {
            const stored = localStorage.getItem(LS_LOCK_KEY);
            if (stored) {
                const ts = parseInt(stored, 10);
                if (!isNaN(ts) && ts > Date.now()) return new Date(ts);
                localStorage.removeItem(LS_LOCK_KEY);
            }
        } catch (_) {}
        return null;
    });

    // "Register" mode from navigation state
    useEffect(() => {
        if (location.state?.isRegister) setIsLogin(false);
    }, [location.state]);

    const token    = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    const user     = userJson ? (() => { try { return JSON.parse(userJson); } catch { return null; } })() : null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear individual field error on change
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleUnlocked = () => {
        setLockUntil(null);
        localStorage.removeItem(LS_LOCK_KEY);
        setAttemptsLeft(null);
        setError('');
    };

    // ── Client-side validation ─────────────────────────────────────────────────
    const validate = () => {
        const errs = {};
        if (!formData.username.trim()) {
            errs.username = 'Username is required';
        } else if (formData.username.trim().length < 3) {
            errs.username = 'Username must be at least 3 characters';
        }
        if (!formData.password) {
            errs.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errs.password = 'Password must be at least 6 characters';
        }
        if (!isLogin) {
            if (!formData.confirmPassword) {
                errs.confirmPassword = 'Please confirm your password';
            } else if (formData.password !== formData.confirmPassword) {
                errs.confirmPassword = 'Passwords do not match';
            }
        }
        return errs;
    };

    // ── Already signed in ──────────────────────────────────────────────────────
    if (token && user) {
        return (
            <div className="lgw">
                <style>{styles}</style>
                <div className="lgw-card text-center">
                    <div className="lgw-icon"><i className="bi bi-person-check-fill" /></div>
                    <h2 style={{ color: 'white', fontWeight: 900, marginBottom: 6 }}>SIGNED IN</h2>
                    <p style={{ color: '#94a3b8', marginBottom: 28, fontSize: '.95rem' }}>
                        Welcome back,{' '}
                        <span style={{ color: '#00d2ff', fontWeight: 800, fontSize: '1.1rem' }}>
                            {user.username}
                        </span>
                    </p>
                    <div className="d-grid gap-3">
                        <button id="go-to-admin-btn" className="btn lgw-btn w-100" onClick={() => navigate('/admin')}>
                            <i className="bi bi-speedometer2 me-2" />GO TO ADMIN PANEL
                        </button>
                        <button className="btn lgw-outline-btn w-100" onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            window.location.reload();
                        }}>
                            <i className="bi bi-box-arrow-right me-2" />LOGOUT
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side validation first
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            return;
        }
        setFieldErrors({});

        setLoading(true);
        const endpoint = isLogin ? '/login' : '/register';

        try {
            const { confirmPassword, ...apiData } = formData;
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...apiData, username: apiData.username.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                // ── Account locked ────────────────────────────────────────────
                if (data.locked && data.lockUntil) {
                    const lockDate = new Date(data.lockUntil);
                    setLockUntil(lockDate);
                    localStorage.setItem(LS_LOCK_KEY, lockDate.getTime().toString());
                    setAttemptsLeft(0);
                    setLoading(false);
                    return;
                }

                // ── Wrong password — attemptsLeft from server ─────────────────
                if (typeof data.attemptsLeft === 'number') {
                    setAttemptsLeft(data.attemptsLeft);
                }

                throw new Error(data.error || 'Something went wrong');
            }

            if (isLogin) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.removeItem(LS_LOCK_KEY);
                navigate('/admin');
            } else {
                setIsLogin(true);
                setError('Registration successful! Please login.');
                setFormData({ username: '', password: '', confirmPassword: '' });
                setAttemptsLeft(null);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="lgw">
            <style>{styles}</style>
            <div className="lgw-card">

                {/* ── LOCK SCREEN ───────────────────────────────────────────── */}
                {lockUntil ? (
                    <LockScreen lockUntil={lockUntil} onUnlocked={handleUnlocked} />
                ) : (
                    <>
                        {/* ── Header ──────────────────────────────────────── */}
                        <div className="text-center mb-4">
                            <div className="lgw-icon"><i className="bi bi-controller" /></div>
                            <h2 style={{ color: 'white', fontWeight: 900, fontSize: '1.5rem', marginBottom: 4 }}>
                                {isLogin ? 'ADMIN ACCESS' : 'CREATE ACCOUNT'}
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '.82rem', margin: 0 }}>
                                {isLogin ? 'Secure administrator portal' : 'Register a new admin account'}
                            </p>
                        </div>

                        {/* ── Server alert ─────────────────────────────────── */}
                        {error && (
                            <div className={`lgw-alert ${error.toLowerCase().includes('successful') ? 'lgw-alert-success' : 'lgw-alert-error'}`}>
                                <i className={`bi ${error.toLowerCase().includes('successful') ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'} me-2`} />
                                {error}
                            </div>
                        )}

                        {/* ── Form ──────────────────────────────────────────── */}
                        <form onSubmit={handleSubmit} noValidate>

                            {/* Username */}
                            <div className="mb-3">
                                <label className="form-label">Username</label>
                                <input
                                    id="admin-username"
                                    type="text"
                                    name="username"
                                    className={`form-control lgw-input${fieldErrors.username ? ' input-error' : ''}`}
                                    placeholder="Enter your handle"
                                    value={formData.username}
                                    onChange={handleChange}
                                    autoComplete="username"
                                />
                                {fieldErrors.username && (
                                    <div style={{ color: '#f87171', fontSize: '.8rem', marginTop: 6, fontWeight: 600 }}>
                                        <i className="bi bi-exclamation-circle me-1" />{fieldErrors.username}
                                    </div>
                                )}
                            </div>

                            {/* Password */}
                            <div className="mb-2">
                                <label className="form-label">Password</label>
                                <input
                                    id="admin-password"
                                    type="password"
                                    name="password"
                                    className={`form-control lgw-input${fieldErrors.password ? ' input-error' : ''}`}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                />
                                {fieldErrors.password && (
                                    <div style={{ color: '#f87171', fontSize: '.8rem', marginTop: 6, fontWeight: 600 }}>
                                        <i className="bi bi-exclamation-circle me-1" />{fieldErrors.password}
                                    </div>
                                )}
                            </div>

                            {/* Attempts badge — shown after 1st wrong attempt */}
                            {isLogin && attemptsLeft !== null && attemptsLeft < MAX_ATTEMPTS && (
                                <AttemptsBadge attemptsLeft={attemptsLeft} />
                            )}

                            {/* Confirm Password (register only) */}
                            {!isLogin && (
                                <div className="mt-4 mb-2">
                                    <label className="form-label">Confirm Password</label>
                                    <input
                                        id="admin-confirm-password"
                                        type="password"
                                        name="confirmPassword"
                                        className={`form-control lgw-input${fieldErrors.confirmPassword ? ' input-error' : ''}`}
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                    />
                                    {fieldErrors.confirmPassword && (
                                        <div style={{ color: '#f87171', fontSize: '.8rem', marginTop: 6, fontWeight: 600 }}>
                                            <i className="bi bi-exclamation-circle me-1" />{fieldErrors.confirmPassword}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                id="admin-login-btn"
                                type="submit"
                                className="btn lgw-btn w-100 mt-4"
                                disabled={loading}
                            >
                                {loading ? (
                                    <><span className="spinner-border spinner-border-sm me-2" />SYNCING...</>
                                ) : isLogin ? (
                                    <><i className="bi bi-shield-check me-2" />ENTER ADMIN PANEL</>
                                ) : (
                                    <><i className="bi bi-person-plus me-2" />CREATE ACCOUNT</>
                                )}
                            </button>
                        </form>

                        {/* ── Mode switch ───────────────────────────────────── */}
                        {!isLogin && (
                            <div className="text-center mt-4">
                                <p style={{ color: '#64748b', fontSize: '.85rem', margin: 0 }}>
                                    Already have an account?{' '}
                                    <button
                                        className="lgw-link"
                                        onClick={() => {
                                            setIsLogin(true);
                                            setError('');
                                            setFieldErrors({});
                                            setAttemptsLeft(null);
                                            setFormData({ username: '', password: '', confirmPassword: '' });
                                        }}
                                    >
                                        Login instead
                                    </button>
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;