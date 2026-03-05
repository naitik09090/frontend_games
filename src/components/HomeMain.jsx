import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// import stickmanLogo from '../assets/stickman.jpg';

const HomeMain = () => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [selectedGame, setSelectedGame] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Pagination refs
    const pageRef = useRef(1);
    const hasMoreRef = useRef(true);
    const loadingRef = useRef(false);
    const navigate = useNavigate();

    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        }
    };

    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://backend-games-phi.vercel.app';


    const fetchGames = async (pageNum) => {
        if (loadingRef.current && pageNum === 1) return;

        loadingRef.current = true;
        if (pageNum > 1) setLoadingMore(true);

        try {
            const limit = 50;
            const response = await fetch(`${API_URL}/games?page=${pageNum}&limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch games');
            const data = await response.json();

            // Handle both response formats: {total, games} or just games array
            const gamesData = data.games || data;

            // console.log(`✅ Fetched ${gamesData.length} games (Page ${pageNum})`);

            if (gamesData.length < limit) {
                hasMoreRef.current = false;
            } else {
                hasMoreRef.current = true;
            }

            setGames(prev => pageNum === 1 ? gamesData : [...prev, ...gamesData]);
        } catch (err) {
            console.error('❌ Error fetching games:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            loadingRef.current = false;
        }
    };

    useEffect(() => {
        // Clear old cache to prevent quota errors
        try {
            localStorage.removeItem('gamesCache');
            localStorage.removeItem('gamesCacheTime');
        } catch (e) {
            // Ignore cleanup errors
        }

        // Initial fetch
        pageRef.current = 1;
        hasMoreRef.current = true;
        fetchGames(1);

        const handleScroll = () => {
            // Check if user scrolled to bottom (with 200px buffer)
            if (
                window.innerHeight + document.documentElement.scrollTop >=
                document.documentElement.scrollHeight - 200
            ) {
                if (hasMoreRef.current && !loadingRef.current) {
                    pageRef.current += 1;
                    fetchGames(pageRef.current);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleCardClick = (game) => {
        // Navigate to the generic player page for ANY game
        navigate(`/game/${game._id}`, { state: { gameData: game } });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedGame(null);
    };

    if (loading) return <div className="container py-5 text-center"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    if (error) return <div className="container py-5 text-center text-danger">Error: {error}</div>;

    return (
        <div className="home-gaming-wrapper">
            <style>
                {`
                .home-gaming-wrapper {
                    min-height: 100vh;
                    background: linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #0f0c29);
                    background-size: 400% 400%;
                    animation: gradientBG 15s ease infinite;
                    font-family: 'Outfit', 'Inter', sans-serif;
                    color: white;
                }

                @keyframes gradientBG {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                /* --- Glass Navbar --- */
                .glass-nav {
                    background: rgba(0, 0, 0, 0.45) !important;
                    backdrop-filter: blur(15px);
                    -webkit-backdrop-filter: blur(15px);
                    border-bottom: 1px solid rgba(0, 210, 255, 0.3);
                    padding: 15px 30px !important;
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
                }

                .navbar-brand {
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    background: linear-gradient(to right, #00d2ff, #3a7bd5);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    filter: drop-shadow(0 0 5px rgba(0, 210, 255, 0.3));
                }

                /* --- Games Grid (Replaces Masonry) --- */
                .games-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 30px;
                    padding: 0 0 50px;
                }

                .grid-column-full {
                    grid-column: 1 / -1;
                }

                .game-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    overflow: hidden;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    height: 100%;
                    transform-origin: center center;
                }

                .game-card:hover {
                    transform: translateY(-10px) scale(1.02);
                    border-color: #00d2ff;
                    box-shadow: 0 20px 40px rgba(0, 210, 255, 0.25);
                    z-index: 10;
                }

                .game-logo-wrapper {
                    position: relative;
                    width: 100%;
                    padding-top: 100%; /* Square Aspect Ratio (1:1) */
                    overflow: hidden;
                }

                .game-logo {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover; /* Fill the square without bars */
                    transition: transform 0.5s ease;
                }

                .game-card:hover .game-logo {
                    transform: scale(1.1);
                }

                .game-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(15, 12, 41, 0.95) 0%, rgba(15, 12, 41, 0.6) 40%, transparent 100%);
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-start;
                    padding: 25px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .game-card:hover .game-overlay {
                    opacity: 1;
                }

                .game-info {
                    transform: translateY(20px);
                    transition: transform 0.3s ease;
                }

                .game-card:hover .game-info {
                    transform: translateY(0);
                }

                /* Mobile Adjustments */
                @media (max-width: 768px) {
                    .games-grid {
                        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                        gap: 15px;
                    }
                    
                    .game-card:hover {
                        transform: none; /* Disable hover lift on touch devices */
                    }
                    
                    .game-overlay {
                        opacity: 1; /* Always show overlay on mobile */
                        background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%);
                        padding: 15px;
                    }

                    .game-info {
                        transform: none;
                    }
                    
                    .game-card h5 {
                        font-size: 1rem;
                    }
                }

                /* Tablet — exactly 4 cards per row */
                @media (min-width: 577px) and (max-width: 1024px) {
                    .games-grid {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 18px;
                    }
                    .game-card:hover {
                        transform: none;
                    }
                    .game-overlay {
                        opacity: 1;
                        background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%);
                        padding: 14px;
                    }
                    .game-info {
                        transform: none;
                    }
                    .game-card h5 {
                        font-size: 0.9rem;
                    }
                }
                `}
            </style>

            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-dark glass-nav sticky-top">
                <div className="container-fluid">
                    <a className="navbar-brand d-flex align-items-center" href="/">
                        <i className="bi bi-controller me-2 fs-3"></i>
                        GAMES
                    </a>
                </div>
            </nav>

            <div className="container py-5">
                {/* Hero Section */}
                <div className="text-center mb-5 animate__animated animate__fadeIn">
                    <h1 className="featured-title fw-bold mb-2" style={{ letterSpacing: '-2px' }}>DISCOVER NEW REALMS</h1>
                    <p className="tagline">Enter our hand-crafted universe of high-intensity web games.</p>
                </div>

                {/* Games Grid */}
                <div className="games-grid">
                    {games.filter(game => game.status !== false).length === 0 ? (
                        <div className="text-center py-5 w-100 grid-column-full">
                            <p className="text-white-50">No games available at the moment.</p>
                        </div>
                    ) : (
                        games.filter(game => game.status !== false).map((game, index) => (
                            <div
                                key={game._id}
                                className="game-wrapper animate__animated animate__fadeInUp"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="game-card" onClick={() => handleCardClick(game)} style={{ cursor: 'pointer' }}>
                                    <div className="game-logo-wrapper">
                                        <img
                                            src={
                                                game.gameLogo
                                                    ? (game.gameLogo.startsWith('http') || game.gameLogo.startsWith('data:')
                                                        ? game.gameLogo
                                                        : `${API_URL}${game.gameLogo.startsWith('/') ? '' : '/images/'}${game.gameLogo}`)
                                                    : 'placeholder'
                                            }
                                            alt={game.gameName}
                                            className="game-logo"
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23fff" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                                            }}
                                        />
                                    </div>
                                    <div className="game-overlay">
                                        <div className="game-info">
                                            <h5 className="text-white fw-bold m-0">{game.gameName}</h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Loading More Spinner */}
                {loadingMore && (
                    <div className="text-center py-4">
                        <div className="spinner-border text-info" role="status">
                            <span className="visually-hidden">Loading more...</span>
                        </div>
                    </div>
                )}

                {/* Game Details Modal */}
                {/* {selectedGame && (
                    <div className={`modal fade glass-modal ${showModal ? 'show' : ''}`} style={{ display: showModal ? 'block' : 'none' }} tabIndex="-1">
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content border-0">
                                <div className="modal-header border-0 pb-0">
                                    <h5 className="modal-title fw-bold">{selectedGame.gameName}</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal}></button>
                                </div>
                                <div className="modal-body p-4">
                                    {(() => {
                                        const file = (selectedGame.iframs && selectedGame.iframs.length > 0 && selectedGame.iframs[0]) ||
                                            selectedGame.gameUrl;

                                        if (file) {
                                            return (
                                                <>
                                                    <div className="ratio ratio-16x9 shadow-lg rounded-4 overflow-hidden mb-4">
                                                        <iframe
                                                            src={file}
                                                            title={selectedGame.gameName}
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                    <div className="text-center mb-4">
                                                        <a href={file} target="_blank" rel="noopener noreferrer" className="btn btn-gaming px-5 py-2">
                                                            FULLSCREEN MODE <i className="bi bi-arrows-fullscreen ms-2"></i>
                                                        </a>
                                                    </div>
                                                    {selectedGame.keyframes && selectedGame.keyframes.length > 0 && (
                                                        <div className="mb-4">
                                                            <h6 className="text-white-50 uppercase small fw-bold mb-3">GALLERY</h6>
                                                            <div className="row g-2">
                                                                {selectedGame.keyframes.map((frame, index) => (
                                                                    <div key={index} className="col-4">
                                                                        <img
                                                                            src={`${API_URL}${frame}`}
                                                                            alt="Preview"
                                                                            className="img-fluid rounded-3 border border-secondary"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="d-flex justify-content-between text-white-50 x-small">
                                                        <span>RELEASED: {new Date(selectedGame.createdAt).toLocaleDateString()}</span>
                                                        <span>VERSION: 1.0.4</span>
                                                    </div>
                                                </>
                                            );
                                        }
                                        return <div className="alert bg-dark text-white border-secondary text-center">Data link corrupted. Contact admin.</div>;
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                )} */}
                {selectedGame && (
                    <div className={`modal fade glass-modal ${showModal ? 'show' : ''}`} style={{ display: showModal ? 'block' : 'none' }} tabIndex="-1">
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content border-0">
                                <div className="modal-header border-0 pb-0">
                                    <h5 className="modal-title fw-bold">{selectedGame.name}</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal}></button>
                                </div>
                                <div className="modal-body p-4">
                                    {(() => {
                                        const file = (selectedGame.file && selectedGame.file.length > 0 && selectedGame.file[0]) ||
                                            selectedGame.gameUrl;

                                        if (file) {
                                            return (
                                                <>
                                                    <div className="ratio ratio-16x9 shadow-lg rounded-4 overflow-hidden mb-4">
                                                        <iframe
                                                            src={file}
                                                            title={selectedGame.name}
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                    <div className="text-center mb-4">
                                                        <a href={file} target="_blank" rel="noopener noreferrer" className="btn btn-gaming px-5 py-2">
                                                            FULLSCREEN MODE <i className="bi bi-arrows-fullscreen ms-2"></i>
                                                        </a>
                                                    </div>
                                                    {selectedGame.keyframes && selectedGame.keyframes.length > 0 && (
                                                        <div className="mb-4">
                                                            <h6 className="text-white-50 uppercase small fw-bold mb-3">GALLERY</h6>
                                                            <div className="row g-2">
                                                                {selectedGame.keyframes.map((frame, index) => (
                                                                    <div key={index} className="col-4">
                                                                        <img
                                                                            src={`${API_URL}${frame}`}
                                                                            alt="Preview"
                                                                            className="img-fluid rounded-3 border border-secondary"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="d-flex justify-content-between text-white-50 x-small">
                                                        <span>RELEASED: {new Date(selectedGame.createdAt).toLocaleDateString()}</span>
                                                        <span>VERSION: 1.0.4</span>
                                                    </div>
                                                </>
                                            );
                                        }
                                        return <div className="alert bg-dark text-white border-secondary text-center">Data link corrupted. Contact admin.</div>;
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {showModal && <div className="modal-backdrop fade show" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={handleCloseModal}></div>}
            </div>
        </div>
    );
};

export default HomeMain;