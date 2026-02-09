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
        : 'https://backend-games-phi.vercel.app/';


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

            console.log(`✅ Fetched ${gamesData.length} games (Page ${pageNum})`);

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

                /* --- Masonry Grid --- */
                .masonry-container {
                    column-count: 5;
                    column-gap: 20px;
                    margin: 0 auto;
                    padding: 0 20px 50px;
                    max-width: 1600px;
                }

                .box {
                    break-inside: avoid;
                    margin-bottom: 20px;
                    page-break-inside: avoid;
                    display: inline-block;
                    width: 100%;
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    will-change: transform;
                }

                .game-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    overflow: hidden;
                    position: relative;
                    display: block;
                    transition: all 0.3s ease;
                    height: auto; /* Allow natural height */
                }

                .box:hover {
                    transform: translateY(-10px);
                    z-index: 10;
                }

                .box:hover .game-card {
                    border-color: #00d2ff;
                    box-shadow: 0 15px 40px rgba(0, 210, 255, 0.3);
                }

                .game-logo {
                    width: 100%;
                    height: auto; /* Natural aspect ratio */
                    min-height: 120px; /* Minimum height for very small images */
                    max-height: none; /* Remove max height restriction */
                    display: block;
                    object-fit: cover;
                    transition: transform 0.4s ease;
                    will-change: transform;
                }

                .box:hover .game-logo {
                    transform: scale(1.05);
                }

                /* Height Variants for Masonry Effect */
                .box-small .game-logo {
                    height: 180px;
                    object-fit: cover;
                }

                .box-medium .game-logo {
                    height: 240px;
                    object-fit: cover;
                }

                .box-large .game-logo {
                    height: 320px;
                    object-fit: cover;
                }

                .box-xlarge .game-logo {
                    height: 400px;
                    object-fit: cover;
                }

                .game-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%);
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    padding: 20px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .box:hover .game-overlay {
                    opacity: 1;
                }

                @media (max-width: 1400px) { .masonry-container { column-count: 4; } }
                @media (max-width: 1100px) { .masonry-container { column-count: 3; } }
                @media (max-width: 800px) { .masonry-container { column-count: 2; } }
                @media (max-width: 500px) { .masonry-container { column-count: 1; max-width: 500px; } }
                /* --- Glass Modal --- */
                .glass-modal .modal-content {
                    background: rgba(15, 12, 41, 0.8) !important;
                    backdrop-filter: blur(25px);
                    border: 1px solid rgba(0, 210, 255, 0.2);
                    border-radius: 24px;
                    color: white;
                }

                .glass-modal .modal-header {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .glass-modal .modal-footer {
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                .btn-gaming {
                    background: linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%);
                    border: none;
                    color: white;
                    font-weight: 700;
                    border-radius: 10px;
                    transition: all 0.3s ease;
                }

                .btn-gaming:hover {
                    box-shadow: 0 0 15px rgba(0, 210, 255, 0.5);
                    transform: translateY(-2px);
                    color: white;
                }

                @media (max-width: 1400px) { .masonry-container { column-count: 4; } }
                @media (max-width: 1100px) { .masonry-container { column-count: 3; } }
                @media (max-width: 768px) { 
                    .masonry-container { 
                        column-count: 2; 
                        column-gap: 12px;
                        padding: 0 12px 50px;
                    } 
                    .box { margin-bottom: 12px; }
                    
                    /* Clean Masonry Style for Mobile */
                    .game-card { 
                        border-radius: 14px; 
                        border: 1px solid rgba(255,255,255,0.1);
                        background: rgba(255, 255, 255, 0.05); /* Restore consistent background */
                    }
                    
                    .game-logo {
                        width: 100%;
                        height: auto; /* Natural height */
                        object-fit: contain;
                        display: block;
                    }

                    /* Minimalist Overlay */
                    .game-overlay {
                        padding: 6px;
                    }
                    .game-overlay h5 { 
                        font-size: 0.65rem; 
                    }
                }
                @media (max-width: 400px) {
                    .masonry-container { column-count: 2; column-gap: 10px; padding: 0 10px 50px; }
                    .box { margin-bottom: 10px; }
                    .game-logo {
                        object-fit: contain;
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
                    <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    {/* <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
                        <ul className="navbar-nav gap-2 align-items-center">
                            {user ? (
                                <>
                                    <li className="nav-item me-2">
                                        <button className="btn btn-outline-info btn-sm rounded-pill px-3" onClick={() => navigate('/admin')}>
                                            <i className="bi bi-shield-lock me-1"></i> Admin Panel
                                        </button>
                                    </li>
                                    <li className="nav-item me-2">
                                        <span className="text-white-50 small">ACTIVE PLAYER: <strong className="text-white">{user.username}</strong></span>
                                    </li>
                                    <li className="nav-item">
                                        <button className="btn btn-link text-danger text-decoration-none p-0" onClick={handleLogout}>
                                            <i className="bi bi-power fs-5"></i>
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li className="nav-item">
                                        <button className="btn btn-gaming px-4" onClick={() => navigate('/admin/login')}>
                                            ADMIN LOGIN
                                        </button>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div> */}
                </div>
            </nav>

            <div className="container py-5">
                {/* Hero Section */}
                <div className="text-center mb-5 animate__animated animate__fadeIn">
                    <h1 className="display-4 fw-bold mb-2" style={{ letterSpacing: '-2px' }}>DISCOVER NEW REALMS</h1>
                    <p className="text-white-50">Explore our curated collection of high-octane web games</p>
                </div>

                {/* Games Grid */}
                <div className="masonry-container">
                    {games.length === 0 ? (
                        <div className="text-center py-5 w-100">
                            <p className="text-white-50">No games available at the moment.</p>
                        </div>
                    ) : (
                        games.map((game, index) => {
                            // Create varying heights for masonry effect
                            const heightVariants = ['small', 'medium', 'large', 'xlarge'];
                            const randomHeight = heightVariants[index % heightVariants.length];

                            return (
                                <div key={game._id} className={`box box-${randomHeight}`} style={{ animationDelay: `${index * 0.05}s` }}>
                                    <div className="game-card" onClick={() => handleCardClick(game)} style={{ cursor: 'pointer' }}>
                                        <img
                                            src={game.gameLogo?.startsWith('http') ? game.gameLogo : `${API_URL}${game.gameLogo?.startsWith('/') ? '' : '/'}${game.gameLogo}`}
                                            alt={game.gameName}
                                            className="game-logo"
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23fff" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                                            }}
                                        />
                                        <div className="game-overlay">
                                            <h5 className="text-white fw-bold m-0">{game.gameName}</h5>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                {/* <div className="masonry-container">
                    {games.length === 0 ? (
                        <div className="text-center py-5 w-100">
                            <p className="text-white-50">No games available at the moment.</p>
                        </div>
                    ) : (
                        games.map((game, index) => (
                            <div key={game._id} className="box" style={{ animationDelay: `${index * 0.05}s` }}>
                                <div className="game-card" onClick={() => handleCardClick(game)} style={{ cursor: 'pointer' }}>
                                    <img
                                        src={game.gameLogo?.startsWith('http') ? game.gameLogo : `${API_URL}${game.gameLogo?.startsWith('/') ? '' : '/'}${game.gameLogo}`}
                                        alt={game.gameName}
                                        className="game-logo"
                                        loading="lazy"
                                        onError={(e) => {
                                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23fff" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                                        }}
                                    />
                                    <div className="game-overlay">
                                        <h5 className="text-white fw-bold m-0">{game.gameName}</h5>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div> */}

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