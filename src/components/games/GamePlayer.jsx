import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import './GamePlayer.css';

// Lazy load the 'More Adventures' grid to reduce initial JS payload for the main game player.
const MoreGamesGrid = lazy(() => import('./MoreGamesGrid.jsx'));
import GameLoader from './GameLoader.jsx';

// ── Module-level cache: games list is fetched ONCE per session ──────────────
let _gamesCache = null;      // cached array
let _gamesCacheFetch = null; // in-flight promise (prevents duplicate requests)

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

    // Track whether component is still mounted to avoid state-after-unmount warnings
    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (!id) return;

        const loadGame = async () => {
            if (!isMounted.current) return;
            setLoading(true);
            setIframeLoaded(false);
            setIsTimedOut(false);
            setBottomReady(false);
            setError(null);

            try {
                // ── 1. Current game (use navigation state if available — instant) ──
                let currentGame = game && game._id === id ? game : null;
                if (!currentGame) {
                    const res = await fetch(`${API_URL}/games/${id}`);
                    if (!res.ok) throw new Error('Game not found');
                    currentGame = await res.json();
                    if (isMounted.current) setGame(currentGame);
                }

                // ── 2. Related games list — use cache if already fetched ──────────
                if (!_gamesCache) {
                    // Deduplicate concurrent fetches with a shared promise
                    if (!_gamesCacheFetch) {
                        _gamesCacheFetch = fetch(`${API_URL}/games?limit=100`)
                            .then(r => r.ok ? r.json() : null)
                            .then(data => {
                                if (!data) return [];
                                let list = Array.isArray(data.games) ? data.games : (Array.isArray(data) ? data : []);
                                list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                                _gamesCache = list.filter(g => g.status !== false);
                                _gamesCacheFetch = null;
                                return _gamesCache;
                            })
                            .catch(() => { _gamesCacheFetch = null; return []; });
                    }
                    await _gamesCacheFetch;
                }

                const pool = (_gamesCache || []).filter(g => g._id !== id);
                const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 24);

                if (isMounted.current) {
                    setAllGames(shuffled);
                    setBottomReady(true);
                    setLoading(false);
                    window.scrollTo({ top: 0, behavior: 'instant' });
                }
            } catch (err) {
                console.error("GamePlayer load error:", err);
                if (isMounted.current) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        };

        loadGame();
    }, [id]);

    // Listen for admin updates or perform a one-time background refresh on mount
    useEffect(() => {
        const API_URL = 'https://backend-games-phi.vercel.app';
        const syncChannel = new (window.BroadcastChannel || class { postMessage() { }; onmessage() { }; close() { } })('gaming_sync');

        const refreshGamesData = async (isBackground = false) => {
            try {
                const r = await fetch(`${API_URL}/games?limit=100`);
                if (!r.ok) return;
                const data = await r.json();
                const list = Array.isArray(data.games) ? data.games : (Array.isArray(data) ? data : []);
                list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                _gamesCache = list.filter(g => g.status !== false);

                // If it's a background refresh, update the state to show new games
                if (isMounted.current) {
                    const pool = _gamesCache.filter(g => g._id !== id);
                    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 24);
                    setAllGames(shuffled);
                    if (!isBackground) setBottomReady(true);
                }
            } catch (e) {
                console.warn("Background refresh failed:", e);
            }
        };

        syncChannel.onmessage = (event) => {
            if (event.data?.type === 'REFRESH_DATA') {
                _gamesCache = null;
                _gamesCacheFetch = null;
                refreshGamesData(true);
            }
        };

        // ONE-TIME AUTO REFRESH: Trigger a fresh fetch on mount to ensure latest data
        // This runs after the initial loadGame() finishes using the cache
        const timer = setTimeout(() => {
            refreshGamesData(true);
        }, 1500); // 1.5s delay to prioritize the main game iframe loading

        return () => {
            clearTimeout(timer);
            if (syncChannel.close) syncChannel.close();
        };
    }, [id]);

    // Safety timeout: if iframe doesn't load in 15s, show manual link
    useEffect(() => {
        let timer;
        if (!iframeLoaded && !loading && game) {
            timer = setTimeout(() => { setIsTimedOut(true); }, 15000);
        }
        return () => clearTimeout(timer);
    }, [iframeLoaded, loading, game, id]);

    const handleCardClick = (clickedGame) => {
        setLoading(true); // Ensure loader shows immediately during transition
        setGame(clickedGame);
        setIframeLoaded(false);
        setIsTimedOut(false);
        setIsFullscreen(false);
        navigate(`/game/${clickedGame._id}`, { state: { gameData: clickedGame } });
        window.scrollTo({ top: 0, behavior: 'instant' });
    };

    // Lock body scroll in fullscreen / landscape
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

    // Fullscreen: toggled via CSS class — iframe stays mounted so game doesn't restart

    // ─── Layout (fullscreen toggled via CSS so game never restarts) ──────────
    return (
        <div className={`gp-wrapper${isFullscreen ? ' gp-wrapper--fullscreen' : ''}`}>

            {/* ── Top bar: Back button ── */}
            <div className="gp-topbar">
                <Link to="/" className="gp-back-btn">
                    <i className="bi bi-chevron-left"></i> RETURN TO BASE
                </Link>
            </div>

            {/* ── iframe zone ── */}
            <div className="gp-iframe-zone">
                {/* Loader overlay */}
                <div className={`gp-loader-overlay ${(showLoader || isTimedOut) ? '' : 'gp-loader-overlay--hidden'}`}>
                    {!isTimedOut ? (
                        <GameLoader />
                    ) : (
                        <div className="text-center p-4">
                            <i className="bi bi-wifi-off fs-1 text-warning mb-3 d-block"></i>
                            <p className="text-white fw-bold mb-1">SIGNAL WEAK</p>
                            <p className="text-white-50 small mb-4">
                                Taking longer than expected… source might be restricted.
                            </p>
                            <div className="d-flex gap-2 justify-content-center">
                                <button className="btn btn-sm btn-outline-info" onClick={() => window.location.reload()}>
                                    RETRY
                                </button>
                                {iframeSrc && (
                                    <a href={iframeSrc} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-info">
                                        OPEN IN NEW TAB
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Iframe or no-source error */}
                {iframeSrc ? (
                    <>
                        <iframe
                            key={game?._id || id}
                            src={iframeSrc}
                            title={game?.gameName || 'Game Player'}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            scrolling="no"
                            className={`gp-iframe ${iframeLoaded ? 'gp-iframe--visible' : ''}`}
                            onLoad={() => setIframeLoaded(true)}
                        />
                        {/* Fullscreen toggle button (mobile) */}
                        <button
                            className="gp-fs-btn d-md-none"
                            onClick={() => setIsFullscreen(f => !f)}
                            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                        >
                            <i className={`bi ${isFullscreen ? 'bi-fullscreen-exit' : 'bi-fullscreen'}`}></i>
                        </button>
                    </>
                ) : (
                    <div className="gp-no-source">
                        <i className="bi bi-exclamation-triangle fs-1 mb-3"></i>
                        <p className="fw-bold">SIGNAL LOST: No playable source found</p>
                        {error && <p className="small mt-2 text-danger">{error}</p>}
                    </div>
                )}
            </div>

            {/* ── More Adventures ── */}
            <div className="gp-more-section">
                <div className="gp-more-header">
                    <span className="gp-more-line"></span>
                    <h3 className="gp-more-title">MORE ADVENTURES</h3>
                    <span className="gp-more-line"></span>
                </div>

                {!bottomReady ? (
                    <div className="py-5">
                        <GameLoader type="inline" />
                    </div>
                ) : (
                    <Suspense fallback={
                        <div className="py-5">
                            <GameLoader type="inline" />
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
    );
};

export default GamePlayer;
