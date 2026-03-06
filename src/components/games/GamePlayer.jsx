import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import './GamePlayer.css';

const GamePlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    // Initialize game from navigation state if available (Instant Load)
    const [game, setGame] = useState(location.state?.gameData || null);
    const [allGames, setAllGames] = useState([]);
    // If we have game data, we are not loading
    const [loading, setLoading] = useState(!location.state?.gameData);
    const [error, setError] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [bottomReady, setBottomReady] = useState(false);
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://backend-games-phi.vercel.app';

    // Returns a URL to serve the game's logo through the /games/:id/logo endpoint.
    const getLogoSrc = (gameId, size = 185) => {
        return `${API_URL}/games/${gameId}/logo?w=${size}`;
    };

    // Lighthouse Moto G Power fix: 330w max saves bandwidth & passes "properly size images"
    const getLogoSrcSet = (gameId) => {
        return `${getLogoSrc(gameId, 185)} 185w, ${getLogoSrc(gameId, 240)} 240w, ${getLogoSrc(gameId, 330)} 330w`;
    };

    // Tells the browser the exact layout size so it picks the perfect w-descriptor BEFORE downloading
    const LOGO_SIZES = '(max-width: 768px) 185px, 240px';

    // For the currently-playing game's logo, the full game object is fetched via /games/:id
    // which still includes gameLogo. We keep the old helper for that case.
    const getOptimizedImageSrc = (gameLogo, size = 185) => {
        if (!gameLogo) return null;
        if (gameLogo.startsWith('data:')) return gameLogo; // already base64 WebP stored in full game
        const absoluteUrl = gameLogo.startsWith('http')
            ? gameLogo
            : `${API_URL}${gameLogo.startsWith('/') ? '' : '/images/'}${gameLogo}`;
        return `${API_URL}/image-proxy?url=${encodeURIComponent(absoluteUrl)}&w=${size}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch specific game data only if we don't have it or need fresh info
                if (!game) {
                    const gameRes = await fetch(`${API_URL}/games/${id}`);
                    if (!gameRes.ok) throw new Error('Game not found');
                    const gameData = await gameRes.json();
                    setGame(gameData);
                }

                // Fetch all games for the grid in background
                const allGamesRes = await fetch(`${API_URL}/games`);
                if (allGamesRes.ok) {
                    const allGamesData = await allGamesRes.json();
                    setAllGames(allGamesData.games || allGamesData);
                    setBottomReady(true);
                }

                setLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        if (id) {
            if (!game) setLoading(true);
            setBottomReady(false); // Reset on game switch

            fetchData();
            window.scrollTo(0, 0);
        }
    }, [id]);

    const handleCardClick = (clickedGame) => {
        // Optimistically set the game to show it immediately
        setGame(clickedGame);
        // Reset fullscreen on switch
        setIsFullscreen(false);

        // Navigate to the same component but with a different ID
        navigate(`/game/${clickedGame._id}`);
        // Instant scroll to top
        window.scrollTo(0, 0);
    };

    // Effect to lock body scroll when in fullscreen or landscape (mobile)
    useEffect(() => {
        const handleResize = () => {
            const isLandscape = window.matchMedia("(max-width: 1024px) and (orientation: landscape)").matches;
            if (isFullscreen || isLandscape) {
                document.body.style.overflow = "hidden";
                document.documentElement.style.overflow = "hidden";
            } else {
                document.body.style.overflow = "";
                document.documentElement.style.overflow = "";
            }
        };

        handleResize();

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            document.body.style.overflow = "";
            document.documentElement.style.overflow = "";
        };
    }, [isFullscreen]);

    // Only show full page loader if we have NO game data at all
    if (loading && !game) return (
        <div className="game-player-gaming-wrapper d-flex justify-content-center align-items-center vh-100">
            <div className="spinner-border text-info" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    if (error) return (
        <div className="container py-5 text-center">
            <div className="alert alert-danger" role="alert">
                Error loading game: {error}
            </div>
            <Link to="/" className="btn btn-primary mt-3">Back to Games</Link>
        </div>
    );

    if (!game) return null;

    // Use the 'file' field or first item in 'iframs' array as source
    const iframeSrc = Array.isArray(game.iframs) && game.iframs.length > 0 ? game.iframs[0] : game.iframs;

    return (
        <div className="game-player-gaming-wrapper">
            <div className={`container-fluid p-0 ${isFullscreen ? 'd-flex flex-column h-100' : ''}`}>
                {!isFullscreen && (
                    <div className="container py-4 position-relative">
                        <div className="d-flex justify-content-start align-items-center">
                            <Link to="/" className="btn-gaming-back mb-0">
                                <i className="bi bi-chevron-left me-2"></i> RETURN TO BASE
                            </Link>
                        </div>
                    </div>
                )}

                <div className={`fullscreen-arena mb-5 ${isFullscreen ? 'm-0 p-0 h-100' : ''}`}>
                    <div
                        className={`iframe-container mobile-game-container ratio ratio-16x9 ${isFullscreen ? 'fullscreen-mode' : ''}`}
                        style={{
                            border: isFullscreen ? 'none' : 'none',
                            maxWidth: isFullscreen ? '100%' : '1200px',
                            margin: '0 auto',
                            position: 'relative'
                        }}
                    >
                        {iframeSrc ? (
                            <>
                                <iframe
                                    src={iframeSrc}
                                    title={game.gameName || game.gameName}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    scrolling="no"
                                    style={{
                                        border: isFullscreen ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                        width: '100%',
                                        height: '100%',
                                        overflow: 'hidden'
                                    }}
                                    className={`${isFullscreen ? '' : 'rounded-3 shadow-lg'}`}
                                ></iframe>

                                <button
                                    className="fullscreen-btn d-md-none"
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                                >
                                    <i className={`bi ${isFullscreen ? 'bi-fullscreen-exit' : 'bi-fullscreen'}`}></i>
                                </button>
                            </>
                        ) : (
                            <div className="d-flex flex-column align-items-center justify-content-center text-white-50 h-100">
                                <i className="bi bi-exclamation-triangle fs-1 mb-3"></i>
                                <p className="fw-bold">SIGNAL LOST: No playable source found</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`container bottom-section${bottomReady ? ' ready' : ''}`}>
                    <div className="d-flex align-items-center py-5">
                        <div className="flex-grow-1 border-bottom border-secondary opacity-25"></div>
                        <h3 className="mx-0 text-white-50 small fw-bold tracking-widest" style={{ letterSpacing: '4px' }}>
                            MORE ADVENTURES
                        </h3>
                        <div className="flex-grow-1 border-bottom border-secondary opacity-25"></div>
                    </div>

                    {!bottomReady ? (
                        /* Neon gaming skeleton */
                        <div className="games-grid">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="skeleton-card">
                                    <div className="skeleton-img"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="games-grid">
                            {allGames
                                .filter(g => g._id !== id)
                                .slice(0, 22)
                                .map((g, index) => (
                                    <div
                                        key={g._id}
                                        className="game-wrapper"
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <div className="game-card" onClick={() => handleCardClick(g)} style={{ cursor: 'pointer' }}>
                                            <div className="game-logo-wrapper">
                                                <img
                                                    src={getLogoSrc(g._id, 185)}
                                                    srcSet={getLogoSrcSet(g._id)}
                                                    sizes={LOGO_SIZES}
                                                    alt={g.gameName}
                                                    className="game-logo"
                                                    width="185"
                                                    height="185"
                                                    loading={index < 4 ? "eager" : "lazy"}
                                                    fetchpriority={index < 4 ? "high" : "auto"}
                                                    decoding="async"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23fff" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                                                    }}
                                                />
                                            </div>
                                            <div className="game-overlay">
                                                <div className="game-info">
                                                    <p className="game-card-title text-white fw-bold m-0">{g.gameName}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GamePlayer;
