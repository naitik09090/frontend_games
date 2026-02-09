import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
    const location = useLocation();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Check for "Register" mode from navigation state
    useEffect(() => {
        if (location.state && location.state.isRegister) {
            setIsLogin(false);
        }
    }, [location.state]);

    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://backend-games-phi.vercel.app';

    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (token && user) {
        return (
            <div className="login-gaming-wrapper">
                <style>
                    {`
                    .login-gaming-wrapper {
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #0f0c29);
                        background-size: 400% 400%;
                        animation: gradientBG 15s ease infinite;
                        padding: 20px;
                        font-family: 'Outfit', 'Inter', sans-serif;
                    }

                    @keyframes gradientBG {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }

                    .glass-card {
                        background: rgba(255, 255, 255, 0.05);
                        backdrop-filter: blur(20px);
                        -webkit-backdrop-filter: blur(20px);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 24px;
                        padding: 40px;
                        width: 100%;
                        max-width: 450px;
                        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8),
                                    0 0 20px rgba(0, 210, 255, 0.2);
                        animation: fadeIn 0.8s ease-out;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    .gaming-logo {
                        font-size: 3.5rem;
                        text-align: center;
                        margin-bottom: 20px;
                        background: linear-gradient(to right, #00d2ff, #3a7bd5);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        filter: drop-shadow(0 0 10px rgba(0, 210, 255, 0.5));
                    }

                    .gaming-btn {
                        background: linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%) !important;
                        border: none !important;
                        padding: 14px !important;
                        border-radius: 12px !important;
                        font-weight: 700 !important;
                        text-transform: uppercase !important;
                        letter-spacing: 2px !important;
                        transition: all 0.3s ease !important;
                        color: white !important;
                        margin-bottom: 15px;
                    }

                    .gaming-btn:hover {
                        box-shadow: 0 0 25px rgba(0, 210, 255, 0.6) !important;
                        transform: translateY(-2px);
                    }

                    .btn-gaming-outline {
                        background: transparent !important;
                        border: 1px solid #dc3545 !important;
                        color: #dc3545 !important;
                        padding: 12px !important;
                        border-radius: 12px !important;
                        font-weight: 600 !important;
                        transition: all 0.3s ease !important;
                    }

                    .btn-gaming-outline:hover {
                        background: rgba(220, 53, 69, 0.1) !important;
                        box-shadow: 0 0 15px rgba(220, 53, 69, 0.3) !important;
                    }
                    `}
                </style>
                <div className="glass-card shadow-lg text-center">
                    <div className="gaming-logo">
                        <i className="bi bi-person-check-fill"></i>
                    </div>
                    <h2 className="text-white mb-3" style={{ fontWeight: 800 }}>SIGNED IN</h2>
                    <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
                        Welcome back, <br />
                        <span style={{ color: '#00d2ff', fontWeight: 700, fontSize: '1.4rem' }}>{user.username}</span>
                    </p>
                    <div className="d-grid gap-2">
                        <button className="btn gaming-btn" onClick={() => navigate('/admin')}>
                            GO TO ADMIN PANEL
                        </button>
                        <button className="btn btn-gaming-outline" onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            window.location.reload();
                        }}>
                            ABANDON MISSION (LOGOUT)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!isLogin && formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        const endpoint = isLogin ? '/login' : '/register';

        try {
            // Exclude confirmPassword from the payload sent to the backend
            const { confirmPassword, ...apiData } = formData;

            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            if (isLogin) {
                // Login success
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/admin'); // Redirect to admin dashboard
            } else {
                // Register success
                setIsLogin(true);
                setError('Registration successful! Please login.'); // Success message
                setFormData({ username: '', password: '', confirmPassword: '' });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-gaming-wrapper">
            <style>
                {`
                .login-gaming-wrapper {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #0f0c29);
                    background-size: 400% 400%;
                    animation: gradientBG 15s ease infinite;
                    padding: 20px;
                    font-family: 'Outfit', 'Inter', sans-serif;
                }

                @keyframes gradientBG {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                .glass-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 40px;
                    width: 100%;
                    max-width: 450px;
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8),
                                0 0 20px rgba(0, 210, 255, 0.2);
                    animation: fadeIn 0.8s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .gaming-logo {
                    font-size: 3rem;
                    text-align: center;
                    margin-bottom: 20px;
                    background: linear-gradient(to right, #00d2ff, #3a7bd5);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    filter: drop-shadow(0 0 10px rgba(0, 210, 255, 0.5));
                }

                .form-label {
                    color: #a0aec0;
                    font-weight: 500;
                    margin-bottom: 8px;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .gaming-input {
                    background: rgba(0, 0, 0, 0.3) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                    padding: 12px 16px !important;
                    border-radius: 12px !important;
                    transition: all 0.3s ease !important;
                }

                .gaming-input:focus {
                    background: rgba(0, 0, 0, 0.5) !important;
                    border-color: #00d2ff !important;
                    box-shadow: 0 0 15px rgba(0, 210, 255, 0.3) !important;
                    transform: scale(1.01);
                }

                .gaming-btn {
                    background: linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%) !important;
                    border: none !important;
                    padding: 14px !important;
                    border-radius: 12px !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 2px !important;
                    transition: all 0.3s ease !important;
                    position: relative;
                    overflow: hidden;
                    color: white !important;
                }

                .gaming-btn:hover {
                    box-shadow: 0 0 25px rgba(0, 210, 255, 0.6) !important;
                    transform: translateY(-2px);
                }

                .gaming-btn:active {
                    transform: translateY(0);
                }

                .gaming-btn::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: rgba(255, 255, 255, 0.1);
                    transform: rotate(45deg);
                    transition: 0.5s;
                }

                .gaming-btn:hover::after {
                    left: 120%;
                }

                .text-gaming-link {
                    color: #00d2ff !important;
                    text-decoration: none !important;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }

                .text-gaming-link:hover {
                    color: #3a7bd5 !important;
                    text-shadow: 0 0 10px rgba(0, 210, 255, 0.4);
                }
                `}
            </style>

            <div className="glass-card shadow-lg">
                <div className="text-center">
                    <div className="gaming-logo">
                        <i className="bi bi-controller"></i>
                    </div>
                    <h2 className="text-white mb-4" style={{ fontWeight: 800, letterSpacing: '-1px' }}>
                        {isLogin ? 'WELCOME BACK' : 'LEVEL UP'}
                    </h2>
                </div>

                {error && (
                    <div className={`alert ${error.includes('successful') ? 'alert-success' : 'alert-danger'} bg-opacity-25 border-0 text-white text-center mb-4`}
                        style={{ background: error.includes('successful') ? 'rgba(40, 167, 69, 0.2)' : 'rgba(220, 53, 69, 0.2)', borderRadius: '12px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            name="username"
                            className="form-control gaming-input"
                            placeholder="Enter your handle"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            minLength="3"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            name="password"
                            className="form-control gaming-input"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength="6"
                        />
                    </div>
                    {!isLogin && (
                        <div className="mb-4">
                            <label className="form-label">Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                className="form-control gaming-input"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                minLength="6"
                            />
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary w-100 gaming-btn mt-2" disabled={loading}>
                        {loading ? (
                            <span className="spinner-border spinner-border-sm me-2"></span>
                        ) : null}
                        {loading ? 'SYNCING...' : (isLogin ? 'ENTER GAME' : 'JOIN SQUAD')}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <p className="mb-0 text-white" style={{ fontSize: '0.9rem' }}>
                        {isLogin ? "NEW PLAYER? " : "OLD SCHOOL? "}
                        <button
                            className="btn btn-link p-0 text-gaming-link"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                                setFormData({ username: '', password: '', confirmPassword: '' });
                            }}
                        >
                            {isLogin ? 'CREATE ACCOUNT' : 'LOGIN INSTEAD'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;