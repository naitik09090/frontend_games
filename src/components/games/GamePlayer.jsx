import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';

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
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://backend-games-zeta-eight.vercel.app';

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch specific game data
                const gameRes = await fetch(`${API_URL}/games/${id}`);
                if (!gameRes.ok) throw new Error('Game not found');
                const gameData = await gameRes.json();
                console.log('%c[Game Data Fetched]', 'color: green; font-weight: bold;', gameData);
                console.log('Game file URL:', gameData.file);
                setGame(gameData);

                // Fetch all games for the grid
                const allGamesRes = await fetch(`${API_URL}/games`);
                if (allGamesRes.ok) {
                    const allGamesData = await allGamesRes.json();
                    // Handle both response formats: {total, games} or just games array
                    setAllGames(allGamesData.games || allGamesData);
                }

                setLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        if (id) {
            // Only set loading true if we don't have a game yet (initial load)
            // or if the current game in state doesn't match the requested ID
            // AND we haven't just optimistically set it (tough to check, but !game covers initial).
            // Actually, for instant switch, we want to allow the "stale" or "optimistic" game to show while fetching.
            if (!game) setLoading(true);

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
                document.documentElement.style.overflow = "hidden"; // Lock html too
            } else {
                document.body.style.overflow = "";
                document.documentElement.style.overflow = "";
            }
        };

        // Check initially
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            document.body.style.overflow = "";
            document.documentElement.style.overflow = "";
        };
    }, [isFullscreen]);

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="spinner-border text-light" role="status">
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

    // Use the 'file' field from games schema as the iframe source
    const iframeSrc = game.iframs;
    // const iframeSrc = game.file;

    return (
        <div className="game-player-gaming-wrapper">
            <style>
                {`
                .game-player-gaming-wrapper {
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

                /* --- Fullscreen Arena --- */
                // .fullscreen-arena {
                //     width: 100%;
                //     background: rgba(0, 0, 0, 0.4);
                //     border-top: 1px solid rgba(0, 210, 255, 0.3);
                //     border-bottom: 1px solid rgba(0, 210, 255, 0.3);
                //     box-shadow: 0 0 50px rgba(0, 0, 0, 0.8),
                //                 inset 0 0 20px rgba(0, 210, 255, 0.1);
                //     animation: fadeIn 0.8s ease-out;
                //     overflow: hidden;
                // }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .ratio-16x9 {
                    max-width: 1200px;
                    margin: 0 auto;
                    border: none !important;
                }

                /* --- Masonry Grid --- */
                .masonry-container {
                    column-count: 5;
                    column-gap: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .box {
                    break-inside: avoid;
                    margin-bottom: 20px;
                    page-break-inside: avoid;
                    display: inline-block;
                    width: 100%;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
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
                    height: auto;
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
                    height: auto;
                    min-height: 120px;
                    max-height: none;
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

                .gaming-title {
                    font-weight: 800;
                    background: linear-gradient(to right, #00d2ff, #3a7bd5);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-transform: uppercase;
                }

                .btn-gaming-back {
                    display: inline-flex;
                    align-items: center;
                    color: rgba(255,255,255,0.7);
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    margin-bottom: 20px;
                }

                .btn-gaming-back:hover {
                    color: #00d2ff;
                    transform: translateX(-5px);
                }

                @media (max-width: 1400px) { .masonry-container { column-count: 4; } }
                @media (max-width: 1100px) { .masonry-container { column-count: 3; } }
                @media (max-width: 800px) { .masonry-container { column-count: 2; } }
                @media (max-width: 500px) { .masonry-container { column-count: 1; max-width: 500px; } }
                /* Automatic Fullscreen on Mobile/Tablet Landscape */
                @media (max-width: 1024px) and (orientation: landscape) {
                    .container.pt-3, 
                    .container.py-5,
                    .btn-gaming-back,
                    .gaming-title {
                        display: none !important;
                    }

                    .fullscreen-arena {
                        position: fixed !important;
                        top: 0;
                        left: 0;
                        width: 100vw !important;
                        height: 100vh !important;
                        height: 100dvh !important;
                        z-index: 9999;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: black;
                        touch-action: none; /* Prevent pull-to-refresh/scroll */
                        overscroll-behavior: none;
                    }

                    .iframe-container {
                        width: 100% !important;
                        height: 100% !important;
                        max-width: none !important;
                        border-radius: 0 !important;
                        border: none !important;
                    }
                    
                    .fullscreen-btn {
                        display: none !important;
                    }
                    
                    /* Hide everything else when in this mode */
                    .game-player-gaming-wrapper {
                        overflow: hidden;
                        height: 100vh;
                        position: fixed;
                        width: 100%;
                    }
                }
                
                /* Change 16:9 to almost full height on mobile portrait */
                @media (max-width: 576px) and (orientation: portrait) { 
                    .masonry-container { column-count: 2; } 
                    .container { padding-left: 10px; padding-right: 10px; }
                    .gaming-title { font-size: 1rem; }
                    
                    /* Compact Header */
                    .container.pt-3.pb-2 {
                        padding-top: 0.5rem !important;
                        padding-bottom: 0.5rem !important;
                        min-height: 50px;
                        display: flex;
                        align-items: center;
                    }
                    
                    .btn-gaming-back {
                        margin-bottom: 0 !important;
                        font-size: 0.8rem;
                    }

                    /* Game takes remaining height exactly */
                    .mobile-game-container {
                        height: calc(100dvh - 60px) !important;
                        padding-top: 0 !important; 
                        margin-bottom: 0 !important;
                        border-radius: 15px !important;
                        border-bottom-left-radius: 0 !important;
                        border-bottom-right-radius: 0 !important;
                        touch-action: none; /* Prevent page scroll when touching game */
                    }
                    
                    .fullscreen-arena {
                        margin-bottom: 0 !important;
                    }
                    
                    .fullscreen-mode {
                        position: fixed !important;
                        top: 0;
                        left: 0;
                        width: 100% !important;
                        height: 100% !important;
                        height: 100dvh !important;
                        z-index: 9999;
                        background: black;
                        border-radius: 0 !important;
                        touch-action: none;
                        overscroll-behavior: none;
                    }
                    
                    /* Mobile Masonry Styles */
                    .game-card { 
                        border-radius: 14px; 
                        border: 1px solid rgba(255,255,255,0.1);
                        background: rgba(255, 255, 255, 0.05);
                    }
                    
                    .game-logo {
                        width: 100%;
                        height: auto;
                        object-fit: contain;
                        display: block;
                    }

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

                
                /* Common Button Styles */
                .fullscreen-btn {
                    position: absolute;
                    bottom: 20px;
                    right: 20px;
                    z-index: 50;
                    background: rgba(0, 0, 0, 0.6);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    backdrop-filter: blur(5px);
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                
                .fullscreen-btn:hover {
                    background: #00d2ff;
                    color: black;
                }

                /* Hide scrollbar but keep functionality */
                *::-webkit-scrollbar {
                    display: none !important;
                }
                * {
                    -ms-overflow-style: none !important;
                    scrollbar-width: none !important;
                }
                `}
            </style>

            <div className={`container-fluid p-0 ${isFullscreen ? 'd-flex flex-column h-100' : ''}`}>
                {!isFullscreen && (
                    <div className="container py-4 position-relative">
                        <div className="d-flex justify-content-start align-items-center">
                            <Link to="/" className="btn-gaming-back mb-0">
                                <i className="bi bi-chevron-left me-2"></i> RETURN TO BASE
                            </Link>
                        </div>
                        {/* Desktop: Centered title */}
                        <h2 className="gaming-title text-center m-0 d-none d-md-block" style={{ pointerEvents: 'none' }}>{game.gameName}</h2>
                        {/* Mobile: Left-aligned title */}
                        <h2 className="gaming-title text-center m-0 d-block d-md-none fs-5 mt-2">{game.gameName}</h2>
                    </div>
                )}

                <div className={`fullscreen-arena mb-5 ${isFullscreen ? 'm-0 p-0 h-100' : ''}`}>
                    <div
                        className={`iframe-container mobile-game-container ratio ratio-16x9 ${isFullscreen ? 'fullscreen-mode' : ''}`}
                        style={{
                            border: isFullscreen ? 'none' : 'none',
                            maxWidth: isFullscreen ? '100%' : '1200px',
                            margin: '0 auto',
                            position: 'relative' // For absolute positioning of button
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
                                    className={`${isFullscreen ? '' : 'rounded-5 shadow-lg'}`}
                                ></iframe>

                                {/* Fullscreen Toggle Button - Visible only on mobile/touch mainly, or generally helpful */}
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

                <div className="container py-5">
                    <div className="d-flex align-items-center mb-4">
                        <div className="flex-grow-1 border-bottom border-secondary opacity-25"></div>
                        <h3 className="mx-4 text-white-50 small fw-bold tracking-widest" style={{ letterSpacing: '4px' }}>
                            MORE ADVENTURES
                        </h3>
                        <div className="flex-grow-1 border-bottom border-secondary opacity-25"></div>
                    </div>

                    <div className="masonry-container">
                        {allGames
                            .filter(g => g._id !== id)
                            .slice(0, 22)
                            .map((g, index) => {
                                // Create varying heights for masonry effect
                                const heightVariants = ['small', 'medium', 'large', 'xlarge'];
                                const randomHeight = heightVariants[index % heightVariants.length];

                                return (
                                    <div key={g._id} className={`box box-${randomHeight}`} style={{ animationDelay: `${index * 0.1}s` }}>
                                        <div className="game-card" onClick={() => handleCardClick(g)} style={{ cursor: 'pointer' }}>
                                            <img
                                                src={g.gameLogo?.startsWith('http') ? g.gameLogo : `${API_URL}${g.gameLogo?.startsWith('/') ? '' : '/'}${g.gameLogo}`}
                                                alt={g.gameName}
                                                className="game-logo"
                                                onError={(e) => {
                                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23fff" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                                                }}
                                            />
                                            <div className="game-overlay">
                                                <h5 className="text-white fw-bold m-0">{g.gameName}</h5>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>
            {/* <div className="container-fluid p-0">
                <div className="container pt-4 pb-2">
                    <Link to="/" className="btn-gaming-back">
                        <i className="bi bi-chevron-left me-2"></i> RETURN TO BASE
                    </Link>
                    <h2 className="gaming-title text-center mb-0">{game.name || game.game_name}</h2>
                </div>

                <div className="fullscreen-arena">
                    <div className="ratio ratio-16x9" style={{ border: 'none', borderRadius: '0' }}>
                        {iframeSrc ? (
                            <iframe
                                src={iframeSrc}
                                title={game.name || game.game_name}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                style={{ border: '1px solid #fff', borderRadius: '20px', width: '100%', height: '100%' }}
                            ></iframe>
                        ) : (
                            <div className="d-flex flex-column align-items-center justify-content-center text-white-50 h-100">
                                <i className="bi bi-exclamation-triangle fs-1 mb-3"></i>
                                <p className="fw-bold">SIGNAL LOST: No playable source found</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="container py-5">
                    <div className="d-flex align-items-center mb-4">
                        <div className="flex-grow-1 border-bottom border-secondary opacity-25"></div>
                        <h3 className="mx-4 text-white-50 small fw-bold tracking-widest" style={{ letterSpacing: '4px' }}>
                            MORE ADVENTURES
                        </h3>
                        <div className="flex-grow-1 border-bottom border-secondary opacity-25"></div>
                    </div>

                    <div className="masonry-container">
                        {allGames
                            .filter(g => g._id !== id) // Hide current game
                            .slice(0, 22) // Limit for performance
                            .map((g, index) => (
                                <div key={g._id} className="box" style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className="game-card" onClick={() => handleCardClick(g)} style={{ cursor: 'pointer' }}>
                                        <img
                                            src={g.image?.startsWith('http') ? g.image : `${API_URL}${g.image?.startsWith('/') ? '' : '/'}${g.image}`}
                                            alt={g.name}
                                            className="game-logo"
                                            onError={(e) => {
                                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23fff" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                                            }}
                                        />
                                        <div className="game-overlay">
                                            <h5 className="text-white fw-bold m-0">{g.name}</h5>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default GamePlayer;
