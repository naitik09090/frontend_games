import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import './GamePlayer.css';

// Lazy load the 'More Adventures' grid to reduce initial JS payload for the main game player.
const MoreGamesGrid = lazy(() => import('./MoreGamesGrid.jsx'));
const GameLoader = lazy(() => import('./GameLoader.jsx'));

const GamePlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize game from navigation state if available (Instant Load)
    const [game, setGame] = useState(() => {
        if (location.state?.gameData) return location.state.gameData;
        return null;
    });
    const [allGames, setAllGames] = useState([]);
    const [loading, setLoading] = useState(!game);
    const [error, setError] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [bottomReady, setBottomReady] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [isTimedOut, setIsTimedOut] = useState(false);
    const REMOTE_URL = 'https://backend-games-phi.vercel.app';
    const API_URL = REMOTE_URL;

    useEffect(() => {
        if (!id) return;

        const loadGameAndRelated = async () => {
            setLoading(true);
            setIframeLoaded(false);
            setIsTimedOut(false);
            setBottomReady(false);
            setError(null);

            try {
                // 1. Fetch current game details from API if not already in state
                let currentGame = game && game._id === id ? game : null;

                if (!currentGame) {
                    const response = await fetch(`${API_URL}/games/${id}`);
                    if (!response.ok) throw new Error('Game not found');
                    currentGame = await response.json();
                    setGame(currentGame);
                }

                // 2. Fetch related games from API (Limited to 100 to optimize payload size)
                let related = [];
                try {
                    const response = await fetch(`${API_URL}/games?limit=100`);
                    if (response.ok) {
                        const data = await response.json();
                        let fetchedGames = Array.isArray(data.games) ? data.games : (Array.isArray(data) ? data : []);

                        // Sort by createdAt descending to ensure newest games are prioritized
                        fetchedGames.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                        // Take the newest 50 games for the related pool
                        const newestGames = fetchedGames.filter(g => g._id !== id && g.status !== false).slice(0, 50);
                        related = newestGames;
                    }
                } catch (e) { console.warn("API related games fetch failed"); }

                // Shuffled subset
                const shuffled = [...related].sort(() => 0.5 - Math.random());
                setAllGames(shuffled.slice(0, 24));

                setBottomReady(true);
                setLoading(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (err) {
                console.error("Error loading game player data:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        loadGameAndRelated();

        // Tab Sync & Auto-Refresh - updates related games when a new game is added in another tab
        const syncChannel = new (window.BroadcastChannel || class { postMessage() { }; onmessage() { }; close() { } })('gaming_sync');
        syncChannel.onmessage = (event) => {
            if (event.data?.type === 'REFRESH_DATA') {
                loadGameAndRelated();
            }
        };

        const handleFocus = () => {
            loadGameAndRelated();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
            if (syncChannel.close) syncChannel.close();
        };
    }, [id]);

    // Safety timeout: if iframe doesn't load in 12s, show manual link
    useEffect(() => {
        let timer;
        if (!iframeLoaded && !loading && game) {
            timer = setTimeout(() => {
                setIsTimedOut(true);
            }, 12000);
        }
        return () => clearTimeout(timer);
    }, [iframeLoaded, loading, game, id]);

    const handleCardClick = (clickedGame) => {
        // Optimistically set the game to show it immediately
        setGame(clickedGame);
        // Reset state for new game
        setIframeLoaded(false);
        setIsTimedOut(false);
        setIsFullscreen(false);

        // Navigate with state so the component sees the new data immediately
        navigate(`/game/${clickedGame._id}`, { state: { gameData: clickedGame } });

        // Instant scroll to top
        window.scrollTo({ top: 0, behavior: 'instant' });
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

    const getIframeSrc = () => {
        if (!game) return null;

        let url = null;
        if (Array.isArray(game.iframs) && game.iframs.length > 0) {
            url = game.iframs[0];
        } else if (typeof game.iframs === 'string' && game.iframs.trim() !== '') {
            url = game.iframs;
        } else if (game.gameUrl && typeof game.gameUrl === 'string' && game.gameUrl.trim() !== '') {
            url = game.gameUrl;
        } else if (game.iframe && typeof game.iframe === 'string' && game.iframe.trim() !== '') {
            url = game.iframe;
        }

        if (url && (url.includes('localhost') || url.includes('127.0.0.1'))) {
            const isLocal = window.location.hostname !== 'localhost';
            if (isLocal) {
                url = url.replace('localhost', window.location.hostname).replace('127.0.0.1', window.location.hostname);
            }
        }

        return url;
    };

    const iframeSrc = getIframeSrc();
    const showLoader = (loading && !game) || !iframeLoaded;

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
                        {(showLoader || isTimedOut) && (
                            <Suspense fallback={null}>
                                <div className="position-absolute inset-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center" style={{ zIndex: 10, background: '#0f0c29' }}>
                                    {!isTimedOut ? (
                                        <GameLoader />
                                    ) : (
                                        <div className="text-center p-4">
                                            <i className="bi bi-wifi-off fs-1 text-warning mb-3"></i>
                                            <p className="text-white fw-bold mb-1">SIGNAL WEAK</p>
                                            <p className="text-white-50 small mb-4">Taking longer than expected... source might be restricted.</p>
                                            <div className="d-flex gap-2 justify-content-center">
                                                <button className="btn btn-sm btn-outline-info" onClick={() => window.location.reload()}>RETRY</button>
                                                <a href={iframeSrc} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-info">OPEN IN NEW TAB</a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Suspense>
                        )}
                        {iframeSrc ? (
                            <>
                                <iframe
                                    key={game?._id || id}
                                    src={iframeSrc}
                                    title={game?.gameName || 'Game Player'}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    scrolling="no"
                                    style={{
                                        border: isFullscreen ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                        width: '100%',
                                        height: '100%',
                                        overflow: 'hidden'
                                    }}
                                    onLoad={() => setIframeLoaded(true)}
                                    className={`${isFullscreen ? '' : 'rounded-3 shadow-lg'} ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
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
                                {error && <p className="small mt-2 text-danger">{error}</p>}
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
                        <Suspense fallback={
                            <div className="games-grid">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="skeleton-card">
                                        <div className="skeleton-img"></div>
                                    </div>
                                ))}
                            </div>
                        }>
                            <MoreGamesGrid
                                games={allGames}
                                onCardClick={handleCardClick}
                                currentId={id}
                                REMOTE_URL={REMOTE_URL}
                            />
                        </Suspense>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GamePlayer;
