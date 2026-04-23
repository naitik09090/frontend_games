import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const location = useLocation();

    // Helper to determine if a path is active
    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <nav className="navbar navbar-expand navbar-dark glass-nav sticky-top py-2">
            <div className="container-fluid px-4">
                <Link className="navbar-brand d-flex align-items-center m-0" to="/" aria-label="Games Hub Home">
                    <i className="bi bi-controller me-2 fs-3 theme-cyan"></i>
                    <span className="fw-bold tracking-tight">GAMIFY</span>
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
