import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Stickman = () => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedGame, setSelectedGame] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const API_URL = 'http://192.168.29.213:5000';

    useEffect(() => {
        fetchGames();
    }, []);

    const fetchGames = async () => {
        try {
            const response = await fetch(`${API_URL}/games`);
            if (!response.ok) throw new Error('Failed to fetch games');
            const data = await response.json();
            setGames(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleCardClick = (game) => {
        // Check if it's a Stickman game (by type or name)
        const isStickman = (game.type && game.type.toLowerCase().includes('stickman')) ||
            (game.name && game.name.toLowerCase().includes('stickman')) ||
            (game.gameType && game.gameType.toLowerCase().includes('stickman')) ||
            (game.gameName && game.gameName.toLowerCase().includes('stickman'));

        // Check if it's a Doodle Road game (by type or name)
        const isDoodleRoad = (game.type && game.type.toLowerCase().includes('doodle')) ||
            (game.name && game.name.toLowerCase().includes('doodle')) ||
            (game.gameType && game.gameType.toLowerCase().includes('doodle')) ||
            (game.gameName && game.gameName.toLowerCase().includes('doodle'));

        if (isStickman) {
            navigate('/games/stickman'); // Opens in the same tab (Client-side routing)
            return;
        }
        if (isDoodleRoad) {
            navigate('/games/doodle_road'); // Opens in the same tab (Client-side routing)
            return;
        }
        setSelectedGame(game);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedGame(null);
    };

    const [stickmanData, setStickmanData] = useState(null);

    useEffect(() => {
        if (games.length > 0) {
            const foundGame = games.find(game =>
                (game.gameName && game.gameName.toLowerCase().includes('stickman')) ||
                (game.name && game.name.toLowerCase().includes('stickman'))
            );
            if (foundGame) {
                setStickmanData(foundGame);
            }
        }
    }, [games]);

    const iframeSrc = (stickmanData && stickmanData.iframs && stickmanData.iframs.length > 0 && stickmanData.iframs[0]) ||
        (stickmanData && stickmanData.gameUrl) ||
        "https://stickyman.vercel.app/"; // Fallback if API hasn't loaded yet

    return (
        <>
            {/* <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <Link to="/" className="btn btn-primary">Back to Game Collection</Link>
            </div> */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: '1200px', maxHeight: 'auto', position: 'relative', paddingBottom: '35.33%', height: 0 }}>
                    <iframe
                        src={iframeSrc}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            borderRadius: '10px',
                            border: 'none'
                        }}
                        title="Stickman Game"
                    >
                    </iframe>
                </div>
            </div>

            {/* Games Section */}
            <div style={{ padding: '5px' }}>
                {loading && <div className="text-center"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>}
                {error && <div className="text-center text-danger">Error: {error}</div>}
                {!loading && !error && (
                    <div className="masonry">
                        {games.map((game) => (
                            <div key={game._id} className="box">
                                <div className="card game-card" onClick={() => handleCardClick(game)} style={{ cursor: 'pointer' }}>
                                    <img src={`${API_URL}${game.gameLogo}`} alt={game.gameName} className="card-img-top game-logo" />
                                    <div className="game-overlay">
                                        <h5 className="text-white mb-0" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{game.gameName || game.gameType}</h5>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Game Details Modal */}
            {selectedGame && (
                <div className={`modal fade ${showModal ? 'show' : ''}`} style={{ display: showModal ? 'block' : 'none' }} tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{selectedGame.gameType}</h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <h6>iframs:</h6>
                                    <div className="row g-2">
                                        {selectedGame.iframs.map((frame, index) => (
                                            <div key={index} className="col-4">
                                                <a href={frame} target="_blank" rel="noopener noreferrer">
                                                    <img
                                                        src={`${API_URL}${frame}`}
                                                        alt={`Keyframe ${index + 1}`}
                                                        className="img-fluid rounded"
                                                    />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p><strong>Added:</strong> {new Date(selectedGame.createdAt).toLocaleDateString()}</p>
                                <p><strong>Updated:</strong> {new Date(selectedGame.updatedAt).toLocaleDateString()}</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showModal && <div className="modal-backdrop fade show" onClick={handleCloseModal}></div>}

            <style>
                {`
                    .masonry{
                      column-count: 4;
                      column-gap: 15px;
                      max-width: 1000px;
                      margin: 0 auto;
                    }

                    .box {
                      background: white;
                      padding: 0;
                      border-radius: 8px;
                      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                      break-inside: avoid;
                      margin-bottom: 15px;
                    }

                    .box:nth-child(1) { height: 250px; }
                    .box:nth-child(2) { height: 300px; }
                    .box:nth-child(3) { height: 200px; }
                    .box:nth-child(4) { height: 300px; }
                    .box:nth-child(5) { height: 280px; }
                    .box:nth-child(6) { height: 320px; }
                    .box:nth-child(7) { height: 220px; }
                    .box:nth-child(8) { height: 360px; }
                    .box:nth-child(9) { height: 280px; }
                    .box:nth-child(10) { height: 140px; }
                    .box:nth-child(11) { height: 200px; }
                    .box:nth-child(12) { height: 175px; }

                    @media (max-width: 900px) {
                      .masonry-container {
                        column-count: 3;
                      }
                    }

                    @media (max-width: 600px) {
                      .masonry-container {
                        column-count: 2;
                      }
                    }

                    @media (max-width: 400px) {
                      .masonry-container {
                        column-count: 1;
                      }
                    }

                    .game-card {
                        border-radius: 16px;
                        overflow: hidden;
                        position: relative;
                        transition: transform 0.2s ease, box-shadow 0.2s ease;
                        background: #f0f0f0;
                        height: 100%;
                    }
                    .game-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 10px 20px rgba(0,0,0,0.15);
                        z-index: 2;
                    }
                    .game-logo {
                        width: 100%;
                        display: block;
                        transition: transform 0.3s ease;
                        height: 100%;
                        object-fit: cover;
                    }

                    .game-overlay {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 100%);
                        padding: 30px 15px 15px;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                        display: flex;
                        align-items: flex-end;
                        justify-content: center;
                        text-align: center;
                        z-index: 5;
                        pointer-events: none;
                    }

                    .game-card:hover .game-overlay {
                        opacity: 1;
                    }

                    .game-overlay h5 {
                        color: #fff !important;
                        width: 100%;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                        margin: 0;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.8);
                    }
                `}
            </style>
        </>
    )
}

export default Stickman