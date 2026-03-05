import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(window.innerWidth > 768);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        let lastMobile = window.innerWidth <= 768;

        const handleResize = () => {
            const currentMobile = window.innerWidth <= 768;
            setIsMobile(currentMobile);

            if (currentMobile !== lastMobile) {
                if (currentMobile) {
                    setIsOpen(false);
                } else {
                    setIsOpen(true);
                }
                lastMobile = currentMobile;
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/');
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                className="btn btn-dark position-fixed top-0 start-0 m-2"
                style={{ zIndex: 1050, display: (!isOpen || isMobile) ? 'block' : 'none' }}
                onClick={toggleSidebar}
            >
                <i className="bi bi-list"></i>
            </button>

            {/* Sidebar Container */}
            <div
                className={`bg-dark text-white min-vh-100 p-3 ${isOpen ? 'd-block' : 'd-none'}`}
                style={{
                    width: '250px',
                    position: isMobile ? 'fixed' : 'relative',
                    zIndex: 1060,
                    top: 0,
                    left: 0,
                    transition: '0.3s'
                }}
            >
                <div className="d-flex justify-content-between align-items-center">
                    <a href="#" style={{ textDecoration: 'none', color: 'white' }}>
                        <h3 className="mb-4">Admin Panel</h3>
                    </a>
                    {isMobile && (
                        <button className="btn btn-sm btn-outline-light mb-4" onClick={toggleSidebar}>
                            <i className="bi bi-x-lg"></i>
                        </button>
                    )}
                </div>

                <ul className="nav nav-pills flex-column mb-auto">
                    <li className="nav-item mb-2">
                        <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link text-white ${isActive ? 'active' : ''}`} onClick={() => isMobile && setIsOpen(false)}>
                            <i className="bi bi-speedometer2 me-2"></i>
                            Dashboard
                        </NavLink>
                    </li>
                    <li className="nav-item mb-2">
                        <NavLink to="/admin/games" className={({ isActive }) => `nav-link text-white ${isActive ? 'active' : ''}`} onClick={() => isMobile && setIsOpen(false)}>
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

            {/* Overlay for Mobile */}
            {isMobile && isOpen && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 bg-black opacity-50"
                    style={{ zIndex: 1050 }}
                    onClick={() => setIsOpen(false)}
                ></div>
            )}
        </>
    );
};

export default Sidebar;
