import React, { useState, useEffect } from 'react';
import GameLoader from '../games/GameLoader';

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
            <h1 className='text-black'>Admin Dashboard</h1>
            <p className="text-muted">Welcome to the game management system.</p>

            <div className="row mt-4">
                <div className="col-md-4">
                    <div className="card text-white bg-primary mb-3 shadow-sm">
                        <div className="card-body text-center py-4">
                            {loading ? (
                                <div className="py-2">
                                    <GameLoader type="minimal" />
                                    <p className="card-text mt-3 small opacity-75">SYNCING DATA...</p>
                                </div>
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
