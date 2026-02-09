import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/');
        }
    };

    return (
        <div className="bg-dark text-white min-vh-100 p-3" style={{ width: '250px' }}>
            <a href="/" style={{ textDecoration: 'none', color: 'white' }}>
                <h3 className="mb-4">Admin Panel</h3>
            </a>
            <ul className="nav nav-pills flex-column mb-auto">
                <li className="nav-item mb-2">
                    <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link text-white ${isActive ? 'active' : ''}`}>
                        <i className="bi bi-speedometer2 me-2"></i>
                        Dashboard
                    </NavLink>
                </li>
                <li className="nav-item mb-2">
                    <NavLink to="/admin/games" className={({ isActive }) => `nav-link text-white ${isActive ? 'active' : ''}`}>
                        <i className="bi bi-controller me-2"></i>
                        Games
                    </NavLink>
                </li>
            </ul>
            <hr />
            <button onClick={handleLogout} className="btn btn-danger w-100 mt-3">
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
            </button>
        </div>
    );
};

export default Sidebar;
