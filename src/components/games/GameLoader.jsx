import React from 'react';
import './GameLoader.css';

const GameLoader = () => {
    return (
        <div className="game-loader-container">
            <div className="loader-particles"></div>
            <div className="loader-radar">
                <div className="loader-sweep"></div>
                <i className="bi bi-controller loader-icon"></i>
            </div>
            <div className="loader-text">INITIALIZING QUANTUM STREAM</div>
            <p className="text-white-50 x-small mt-2" style={{ fontSize: '0.65rem', letterSpacing: '2px' }}>
                ESTABLISHING SECURE TACTICAL LINK
            </p>
        </div>
    );
};

export default GameLoader;
