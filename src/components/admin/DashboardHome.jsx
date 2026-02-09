import React, { useState, useEffect } from 'react';

const DashboardHome = () => {
    const [stats, setStats] = useState({ totalGames: 0 });
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://game-backend-pi.vercel.app';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${API_URL}/games`);
                const data = await response.json();
                setStats({ totalGames: data.length });
            } catch (err) {
                console.error('Error fetching stats:', err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div>
            <h1>Admin Dashboard</h1>
            <p className="text-muted">Welcome to the game management system.</p>

            <div className="row mt-4">
                <div className="col-md-4">
                    <div className="card text-white bg-primary mb-3 shadow-sm">
                        <div className="card-body text-center py-4">
                            <h5 className="card-title display-4">{stats.totalGames}</h5>
                            <p className="card-text">Total Games</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
