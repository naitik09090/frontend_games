import React from 'react';
import { Link } from 'react-router-dom';
import './MoreGamesGrid.css';

const MoreGamesGrid = ({ games, onCardClick, currentId, API_URL }) => {
    // Tells the browser the exact layout size so it picks the perfect w-descriptor
    const LOGO_SIZES = '(max-width: 768px) 185px, 240px';

    const getLogoSrc = (gameId, size = 185) => `${API_URL}/games/${gameId}/logo?w=${size}`;
    const getLogoSrcSet = (gameId) => `${getLogoSrc(gameId, 185)} 185w, ${getLogoSrc(gameId, 240)} 240w, ${getLogoSrc(gameId, 330)} 330w`;

    return (
        <div className="games-grid">
            {games
                .filter(g => g._id !== currentId)
                .slice(0, 22)
                .map((g, index) => (
                    <div
                        key={g._id}
                        className="game-wrapper"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="game-card" onClick={() => onCardClick(g)} style={{ cursor: 'pointer' }}>
                            <div className="game-logo-wrapper">
                                <img
                                    src={getLogoSrc(g._id, 185)}
                                    srcSet={getLogoSrcSet(g._id)}
                                    sizes={LOGO_SIZES}
                                    alt={g.gameName}
                                    className="game-logo"
                                    width="185"
                                    height="185"
                                    loading="lazy"
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
    );
};

export default MoreGamesGrid;
