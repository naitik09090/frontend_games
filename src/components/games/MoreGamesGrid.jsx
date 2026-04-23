import React from 'react';
import { Link } from 'react-router-dom';
import './MoreGamesGrid.css';

const MoreGamesGrid = ({ games, onCardClick, currentId, REMOTE_URL: propRemoteUrl }) => {
    // Falls back to the prop if provided, otherwise uses the hardcoded default
    // const isLocal = window.location.hostname === 'localhost' || 
    //                 window.location.hostname.startsWith('192.168.') ||
    //                 window.location.hostname.startsWith('10.');

    // const backendHost = (isLocal && window.location.hostname !== 'localhost') ? window.location.hostname : 'localhost';
    const DEFAULT_REMOTE = 'https://backend-games-phi.vercel.app';
    const REMOTE_URL = propRemoteUrl || DEFAULT_REMOTE;

    // Tells the browser the exact layout size so it picks the perfect w-descriptor
    // On mobile (max-width: 768px), cards are roughly 160-185px wide.
    const LOGO_SIZES = '(max-width: 576px) 140px, (max-width: 768px) 185px, (max-width: 1024px) 210px, 240px';

    const getLogoSrc = (g, size = 185) => {
        if (!g) return '';
        const globalVersion = localStorage.getItem('globalGameUpdateVersion');
        const timeParam = globalVersion ? `&v=${globalVersion}` : '';

        if (g.gameLogo) {
            if (g.gameLogo.startsWith('data:')) return g.gameLogo;
            if (g.gameLogo.startsWith('http')) return g.gameLogo;

            const path = g.gameLogo.startsWith('/') ? g.gameLogo : `/${g.gameLogo}`;
            return `${REMOTE_URL}${path}?w=${size}&q=20&f=webp${timeParam}`;
        }
        return `${REMOTE_URL}/games/${g._id}/logo?w=${size}&q=20&f=webp${timeParam}`;
    };

    const getLogoSrcSet = (g) => {
        if (g.gameLogo) return undefined;
        return `${getLogoSrc(g, 120)} 120w, ${getLogoSrc(g, 185)} 185w, ${getLogoSrc(g, 240)} 240w, ${getLogoSrc(g, 330)} 330w, ${getLogoSrc(g, 400)} 400w`;
    };

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
                                    src={getLogoSrc(g, 185)}
                                    srcSet={getLogoSrcSet(g)}
                                    sizes={LOGO_SIZES}
                                    alt={g.gameName}
                                    className="game-logo"
                                    width="185"
                                    height="185"
                                    loading={index < 4 ? "eager" : "lazy"}
                                    fetchPriority={index < 4 ? "high" : "auto"}
                                    decoding="async"
                                    onError={(e) => {
                                        if (REMOTE_URL && e.target.src.includes('localhost:5000')) {
                                            e.target.src = e.target.src.replace('http://localhost:5000', REMOTE_URL);
                                            if (e.target.srcset) {
                                                e.target.srcset = e.target.srcset.replaceAll('http://localhost:5000', REMOTE_URL);
                                            }
                                        } else {
                                            e.target.onerror = null;
                                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23fff" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                                        }
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
