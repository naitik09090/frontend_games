import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AdminLayout = () => {
    return (
        <div className="d-flex">
            <Sidebar />
            <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
                {/* Mobile Spacer to prevent overlap with top-fixed button */}
                <div className="d-md-none" style={{ height: '40px' }}></div>
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;
