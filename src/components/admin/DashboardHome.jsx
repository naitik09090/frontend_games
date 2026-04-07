import React, { useState, useEffect } from 'react';

// Removed static JSON import (3MB!) to fix bundle size Lighthouse errors
const DashboardHome = () => {
    const [stats, setStats] = useState({ totalGames: 0 });
    const [loading, setLoading] = useState(false);
    const API_URL = 'https://backend-games-phi.vercel.app';
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/games`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Stats fetch failed');
                const data = await response.json();

                const count = data.pagination?.totalGames ||
                    (Array.isArray(data.games) ? data.games.length : (Array.isArray(data) ? data.length : 0));

                setStats({ totalGames: count });
            } catch (err) {
                console.error('Backend reach failed for stats:', err);
                setStats({ totalGames: 0 });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [token]);

    return (
        <div>
            <h1>Admin Dashboard</h1>
            <p className="text-muted">Welcome to the game management system.</p>

            <div className="row mt-4">
                <div className="col-md-4">
                    <div className="card text-white bg-primary mb-3 shadow-sm">
                        <div className="card-body text-center py-4">
                            {loading ? (
                                <>
                                    <div className="spinner-border text-light mb-3" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="card-text">Loading game count...</p>
                                </>
                            ) : (
                                <>
                                    <h5 className="card-title display-4">{stats.totalGames.toLocaleString()}</h5>
                                    <p className="card-text">Total Games</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
