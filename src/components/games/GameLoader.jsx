import React from 'react';
import './GameLoader.css';

const GameLoader = ({ type = 'full' }) => {
    const typeClasses = {
        full: 'loader-type-full',
        viewport: 'loader-type-viewport',
        inline: 'loader-type-inline',
        minimal: 'loader-type-minimal'
    };

    const containerClass = `game-loader-container ${typeClasses[type] || typeClasses.full}`;

    const statuses = [
        "ESTABLISHING TACTICAL LINK",
        "SYNCING QUANTUM STREAM",
        "LOADING ASSETS",
        "BYPASSING FIREWALLS",
        "OPTIMIZING DATA FLOW"
    ];
    const [statusIndex, setStatusIndex] = React.useState(0);

    React.useEffect(() => {
        if (type === 'minimal') return;
        const interval = setInterval(() => {
            setStatusIndex((prev) => (prev + 1) % statuses.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [type]);

    return (
        <div className={containerClass}>
            {(type === 'full' || type === 'viewport') && (
                <>
                    <div className="loader-particles"></div>
                    <div className="loader-scanline"></div>
                </>
            )}

            <div className="loader-radar-v2">
                <div className="radar-ring-outer"></div>
                <div className="radar-ring-middle"></div>
                <div className="radar-ring-inner"></div>
                <div className="loader-sweep-v2"></div>
                <i className="bi bi-controller loader-icon-v2"></i>
            </div>

            {type !== 'minimal' && (
                <div className="loader-info-v2">
                    <div className="loader-text-v2" data-text="QUANTUM STREAM">QUANTUM STREAM</div>
                    <div className="loader-status-v2">
                        {statuses[statusIndex]}
                        <span className="status-dots"></span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameLoader;
