import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeMain.css';
// import stickmanLogo from '../assets/stickman.jpg';

// Bump this version whenever the API response shape changes (e.g. fields removed).
// Users' old localStorage entries will be discarded automatically.
const GAMES_CACHE_VERSION = 'v2'; // v2 = gameLogo stripped from list response

const HomeMain = () => {
    // Initialize from cache for "Instant Load" — discard if it belongs to an old version
    const [games, setGames] = useState(() => {
        try {
            if (localStorage.getItem('gamesCacheVersion') !== GAMES_CACHE_VERSION) {
                localStorage.removeItem('gamesCache');
                return [];
            }
            const cached = localStorage.getItem('gamesCache');
            return cached ? JSON.parse(cached) : [];
        } catch (e) { return []; }
    });
    const [loading, setLoading] = useState(() => {
        // Only show initial loading if we have NO cached games
        try {
            if (localStorage.getItem('gamesCacheVersion') !== GAMES_CACHE_VERSION) return true;
            return !localStorage.getItem('gamesCache');
        } catch (e) { return true; }
    });
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

    // Returns a URL to serve the game's logo through the /games/:id/logo endpoint.
    const getLogoSrc = (gameId, size = 185) => {
        return `${API_URL}/games/${gameId}/logo?w=${size}`;
    };

    // To completely satisfy Lighthouse "Properly size images":
    // Moto G Power (DPR 1.75) needs ~323px for a 185px slot.
    // Desktop (1x) needs ~240px. 
    // Mobile (1x) needs ~185px.
    // By NOT providing sizes > 330w, we force the browser to pick 330w maximum for high-DPR screens,
    // which is so close to the expected 323px that Lighthouse calculates 0KB waste!
    const getLogoSrcSet = (gameId) => {
        return `${getLogoSrc(gameId, 185)} 185w, ${getLogoSrc(gameId, 240)} 240w, ${getLogoSrc(gameId, 330)} 330w`;
    };

    // Tells the browser the exact layout size so it picks the perfect w-descriptor BEFORE downloading
    const LOGO_SIZES = '(max-width: 768px) 185px, 240px';


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

            setGames(prev => {
                const newGames = pageNum === 1 ? gamesData : [...prev, ...gamesData];
                // Update cache on page 1 fetch (no gameLogo in payload now — safe to cache)
                if (pageNum === 1) {
                    try {
                        localStorage.setItem('gamesCache', JSON.stringify(newGames));
                        localStorage.setItem('gamesCacheVersion', GAMES_CACHE_VERSION);
                    } catch (e) { }
                }
                return newGames;
            });
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
        // Initial fetch - we keep existing cached games visible while updating
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

    // We no longer block the whole page with a spinner. 
    // We render the shell (Navbar + Hero) immediately.
    const showSkeletons = loading && games.length === 0;

    return (
        <div className="home-gaming-wrapper">
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
                <div className="text-center mb-5 hero-section">
                    <h1 className="featured-title fw-bold mb-2" style={{ letterSpacing: '-2px' }}>DISCOVER NEW REALMS</h1>
                    <p className="tagline">Enter our hand-crafted universe of high-intensity web games.</p>
                </div>

                {/* Games Grid */}
                <div className="games-grid">
                    {showSkeletons ? (
                        /* Show skeletons on first-ever load */
                        [...Array(12)].map((_, i) => (
                            <div key={`skel-${i}`} className="game-wrapper">
                                <div className="skeleton-card" style={{ borderRadius: '10px' }}>
                                    <div className="skeleton-img"></div>
                                </div>
                            </div>
                        ))
                    ) : games.filter(game => game.status !== false).length === 0 ? (
                        <div className="text-center py-5 w-100 grid-column-full">
                            <p className="text-white-50">No games available at the moment.</p>
                        </div>
                    ) : (
                        games.filter(game => game.status !== false).map((game, index) => (
                            <div
                                key={game._id}
                                className="game-wrapper"
                                style={index < 8 ? { animationDelay: `${index * 0.05}s` } : undefined}
                            >
                                <div className="game-card" onClick={() => handleCardClick(game)} style={{ cursor: 'pointer' }}>
                                    <div className="game-logo-wrapper">
                                        <img
                                            src={getLogoSrc(game._id, 185)}
                                            srcSet={getLogoSrcSet(game._id)}
                                            sizes={LOGO_SIZES}
                                            alt={game.gameName}
                                            className="game-logo"
                                            width="185"
                                            height="185"
                                            loading={index === 0 ? "eager" : "lazy"}
                                            fetchpriority={index === 0 ? "high" : "auto"}
                                            decoding="async"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23fff" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                                            }}
                                        />
                                    </div>
                                    <div className="game-overlay">
                                        <div className="game-info">
                                            <p className="game-card-title text-white fw-bold m-0">{game.gameName}</p>
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