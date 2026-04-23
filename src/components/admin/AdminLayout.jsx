import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AdminLayout = () => {
    return (
        <div className="d-flex">
            <Sidebar />
            <div className="flex-grow-1 p-2 p-md-4 position-relative" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', overflowX: 'hidden' }}>
                {/* Mobile Spacer to prevent overlap with top-fixed button */}
                <div className="d-md-none" style={{ height: '50px' }}></div>
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;
