import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import stickmanLogo from '../assets/stickman.jpg';

const FormMain = () => {
    const [games, setGames] = useState([]);
    const [newGame, setNewGame] = useState({
        gameName: '',
        gameLogo: null,
        iframs: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const API_URL = 'http://192.168.29.213:5000'; // Adjust if port differs

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

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'gameLogo') {
            setNewGame(prev => ({
                ...prev,
                [name]: files[0]
            }));
        } else {
            setNewGame(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleCardClick = (game) => {
        navigate(`/game/${game._id}`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('gameName', newGame.gameName);
            if (newGame.gameLogo) {
                formData.append('gameLogo', newGame.gameLogo);
            }
            // Use iframs URL as gameUrl fallback
            formData.append('gameUrl', newGame.iframs);
            formData.append('iframs', newGame.iframs);

            const response = await fetch(`${API_URL}/games`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error('Failed to add game');
            const addedGame = await response.json();
            setGames(prev => [...prev, addedGame]);
            setNewGame({ gameName: '', gameLogo: null, iframs: '' });
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="container py-5 text-center"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    if (error) return <div className="container py-5 text-center text-danger">Error: {error}</div>;

    return (
        <div className="container py-5">
            <div className="text-center mb-4">
                <img src={`${API_URL}/images/stickman.jpg`} alt="Stickman Logo" className="img-fluid rounded-circle mb-3" style={{ width: '96px', height: '96px' }} />
                <h1 className="display-4">Game Collection</h1>
            </div>

            {/* Add Game Form */}
            <div className="card mb-4">
                <div className="card-body">
                    <h2 className="card-title h4 mb-4">Add New Game</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="gameName" className="form-label">Game Name</label>
                            <input
                                type="text"
                                id="gameName"
                                name="gameName"
                                value={newGame.gameName}
                                onChange={handleInputChange}
                                required
                                className="form-control"
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="gameLogo" className="form-label">Game Logo Image</label>
                            <input
                                type="file"
                                id="gameLogo"
                                name="gameLogo"
                                onChange={handleInputChange}
                                accept="image/*"
                                className="form-control"
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="iframs" className="form-label">Iframe URL (Embed Link)</label>
                            <input
                                type="url"
                                id="iframs"
                                name="iframs"
                                value={newGame.iframs}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="https://example.com/embed/game"
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                        >
                            Add Game
                        </button>
                    </form>
                </div>
            </div>

            {/* Games Grid */}
            <div className="row">
                {games.map((game) => (
                    <div key={game._id} className="col-md-4 mb-4">
                        <div className="card h-100 game-card" onClick={() => handleCardClick(game)} style={{ cursor: 'pointer' }}>
                            <img src={`${API_URL}${game.gameLogo}`} alt={game.gameName} className="card-img-top game-logo" style={{ height: '200px', objectFit: 'cover' }} />
                            <div className="card-body d-flex flex-column">
                                <h3 className="card-title h5 game-name">{game.gameName || game.gameType}</h3>
                                <p className="card-text text-muted small mt-auto">Added: {new Date(game.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FormMain;