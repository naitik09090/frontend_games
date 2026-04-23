import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameLoader from '../games/GameLoader';
// Decoupled 3MB JSON import to fix bundle payload Lighthouse error.
const ManageGames = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // Process local data for consistent access
    const processLocalData = (data) => {
        return data.map(g => ({
            ...g,
            _id: g._id?.$oid || g._id,
            createdAt: g.createdAt?.$date || g.createdAt,
            updatedAt: g.updatedAt?.$date || g.updatedAt
        }));
    };

    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingGame, setEditingGame] = useState(null);
    const [formData, setFormData] = useState({
        gameName: '',
        gameLogoFile: null,   // actual File object for upload
        gameLogoPreview: null, // base64 string only for preview
        iframs: ''
    });
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [fileInputKey, setFileInputKey] = useState(Date.now());
    const [itemsPerPage] = useState(10);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Automatically switch between local and remote backend

    const API_URL = 'https://backend-games-phi.vercel.app';
    const REMOTE_URL = API_URL;

    useEffect(() => {
        const loadInitialGames = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/games?limit=1000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('API fetch failed');
                const data = await response.json();
                let gamesDataSlice = Array.isArray(data.games) ? data.games : (Array.isArray(data) ? data : []);

                // Sort by createdAt descending
                gamesDataSlice.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                setGames(gamesDataSlice);
            } catch (err) {
                console.warn('Backend API unreachable, attempting local JSON fallback fetch:', err);
                try {
                    const localRes = await fetch('/data/game.games.json');
                    const rawLocal = await localRes.json();
                    const localProcessed = processLocalData(rawLocal);
                    setGames(localProcessed);
                    console.log('Currently showing local backup data. Changes might not sync live.');
                } catch (fallbackError) {
                    console.log('Critical: Could not reach backend or local fallback.');
                }
            } finally {
                setLoading(false);
            }
        };

        loadInitialGames();

        const closeDropdowns = () => setOpenDropdownId(null);
        window.addEventListener('click', closeDropdowns);
        return () => window.removeEventListener('click', closeDropdowns);
    }, []);

    const fetchGames = async () => {
        try {
            const response = await fetch(`${API_URL}/games?limit=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Refresh failed');
            const data = await response.json();
            setGames(data.games || data);
        } catch (err) {
            console.error('Failed to refresh from backend:', err);
            // Don't alert if we already have local data showing
        }
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'gameLogo' && files && files[0]) {
            const file = files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, gameLogoFile: file, gameLogoPreview: reader.result }));
            };
            reader.readAsDataURL(file);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('gameName', formData.gameName);

            if (formData.gameLogoFile) {
                fd.append('gameLogo', formData.gameLogoFile, formData.gameLogoFile.name);
            }

            fd.append('gameUrl', formData.iframs);
            fd.append('iframs', formData.iframs);

            const url = editingGame ? `${API_URL}/games/${editingGame._id}` : `${API_URL}/games`;
            const method = editingGame ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                body: fd,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(errorData.error || `Failed to ${editingGame ? 'update' : 'add'} game`);
            }

            await fetchGames();
            resetForm();

            // Generate a fresh cache-busting timestamp so all tabs know images have been updated
            const newVersion = Date.now().toString();
            localStorage.setItem('globalGameUpdateVersion', newVersion);

            alert(`Game ${editingGame ? 'updated' : 'added'} successfully!`);

            // Notify other tabs to refresh
            try {
                const syncChannel = new BroadcastChannel('gaming_sync');
                syncChannel.postMessage({ type: 'REFRESH_DATA', method: editingGame ? 'PUT' : 'POST', version: newVersion });
                syncChannel.close();
            } catch (e) { }
        } catch (err) {
            console.error('Submit Error:', err);
            // If it's a TypeError and the message is 'Failed to fetch', it's usually a network/CORS issue
            if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
                alert('Connection Error: Could not reach the backend server. Please check your internet connection or backend status.');
            } else {
                alert(`Error: ${err.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this game?')) return;
        try {
            const response = await fetch(`${API_URL}/games/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete game');
            setGames(prev => prev.filter(g => g._id !== id));
            alert('Game deleted successfully');
        } catch (err) {
            alert(err.message);
        }
    };

    const handleEdit = (game) => {
        setEditingGame(game);
        setFormData({
            gameName: game.gameName || '',
            gameLogoFile: null,
            gameLogoPreview: getLogoSrc(game),
            iframs: (Array.isArray(game.iframs) ? game.iframs.join(', ') : game.iframs) || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingGame(null);
        setFormData({ gameName: '', gameLogoFile: null, gameLogoPreview: null, iframs: '' });
        setFileInputKey(Date.now());
    };

    const handleToggleStatus = async (id) => {
        try {
            const response = await fetch(`${API_URL}/games/${id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to toggle status');
            const data = await response.json();
            setGames(prev => prev.map(g => g._id === id ? { ...g, status: data.status } : g));
        } catch (err) {
            alert(err.message);
        }
    };

    // Pagination safety with descending sort (newest first)
    const sortedGames = [...(Array.isArray(games) ? games : (games?.games || []))]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const gamesList = sortedGames;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = gamesList.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(gamesList.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const [viewingJson, setViewingJson] = useState(null);

    // gameLogo can be a direct path in JSON or fetched through backend.
    const getLogoSrc = (game) => {
        if (!game) return '';
        const timestamp = Date.now();
        if (game.gameLogo) {
            if (game.gameLogo.startsWith('data:')) return game.gameLogo;
            if (game.gameLogo.startsWith('http')) return game.gameLogo;

            const path = game.gameLogo.startsWith('/') ? game.gameLogo : `/${game.gameLogo}`;
            return `${REMOTE_URL}${path}?q=35&t=${timestamp}`;
        }
        return `${REMOTE_URL}/games/${game._id}/logo?q=35&t=${timestamp}`;
    };

    const fallbackSvg = (size = 50) =>
        `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"%3E%3Crect fill="%23ddd" width="${size}" height="${size}" rx="6"/%3E%3Ctext fill="%23999" font-size="${Math.round(size / 5)}" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Img%3C/text%3E%3C/svg%3E`;

    if (loading) return <GameLoader type="full" />;

    return (
        <div className="container-fluid px-0">
            <style>{`
                /* ── Toggle ── */
                .form-switch .form-check-input {
                    width: 3em;
                    height: 1.6em;
                    cursor: pointer;
                    background-color: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                }
                .form-switch .form-check-input:checked {
                    background-color: #0A5ED7;
                    border-color: #0A5ED7;
                    box-shadow: 0 0 10px rgba(10, 94, 215, 0.4);
                }

                /* JSON viewer */
                .json-viewer-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.8);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .json-card {
                    background: #1e1e1e;
                    color: #d4d4d4;
                    width: 100%;
                    max-width: 600px;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                }
                .json-card-header {
                    background: #2d2d2d;
                    padding: 12px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #3c3c3c;
                }
                .json-card-body {
                    padding: 20px;
                    max-height: 70vh;
                    overflow-y: auto;
                    font-family: 'Consolas', 'Monaco', monospace;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
                pre { margin: 0; color: #9cdcfe; }

                /* Hide scrollbar */
                *::-webkit-scrollbar { display: none !important; }
                * { -ms-overflow-style: none !important; scrollbar-width: none !important; }

                /* Dropdown */
                .dropdown-menu { z-index: 1050; }

                /* ── Mobile card list ── */
                .game-mobile-list {
                    background: #fff;
                }
                .game-card-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 12px;
                    border-bottom: 1px solid #e9ecef;
                    background: #fff;
                }
                .game-card-item:last-child { border-bottom: none; }

                .game-card-logo {
                    flex-shrink: 0;
                    width: 50px;
                    height: 50px;
                    object-fit: cover;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .game-card-info {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                
                .game-card-name {
                    font-weight: 500;
                    font-size: 1rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    color: #212529;
                    margin-bottom: 2px;
                }

                .game-card-actions {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 10px;
                    flex-shrink: 0;
                }

                /* Status badge */
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    padding: 2px 8px;
                    border-radius: 12px;
                }
                .status-badge.active   { background: #e6f4ea; color: #1e8e3e; }
                .status-badge.inactive { background: #fce8e6; color: #d93025; }
                .status-dot {
                    width: 6px; height: 6px;
                    border-radius: 50%;
                    display: inline-block;
                }
                .status-badge.active .status-dot { background: #1e8e3e; }
                .status-badge.inactive .status-dot { background: #d93025; }

                /* Show/hide by breakpoint */
                .game-mobile-list   { display: none; }
                .game-desktop-table { display: block; }

                @media (max-width: 767.98px) {
                    .game-mobile-list   { display: block; padding: 12px; }
                    .game-desktop-table { display: none; }
                }

                /* Desktop table overflow fix */
                @media (min-width: 768px) {
                    .table-responsive { overflow: visible !important; }
                }

                /* Form buttons full-width on xs */
                @media (max-width: 575.98px) {
                    .btn-form-action { width: 100% !important; }
                }
            `}</style>

            {viewingJson && (
                <div className="json-viewer-overlay" onClick={() => setViewingJson(null)}>
                    <div className="json-card" onClick={e => e.stopPropagation()}>
                        <div className="json-card-header">
                            <h6 className="m-0 text-white">Raw JSON: {viewingJson.gameName}</h6>
                            <button className="btn-close btn-close-white" onClick={() => setViewingJson(null)}></button>
                        </div>
                        <div className="json-card-body">
                            <pre>{JSON.stringify(viewingJson, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-100">
                <h2 className="mb-4 text-bold text-dark">Manage Games</h2>

                {/* ── Add / Edit Form ── */}
                <div className="card shadow-sm mb-4">
                    <div className="card-body p-4">
                        <h5 className="card-title mb-3">{editingGame ? 'Edit Game' : 'Add New Game'}</h5>
                        <form onSubmit={handleSubmit} className="row g-3">
                            <div className="col-12 col-md-4">
                                <label className="form-label fw-medium">Game Name</label>
                                <input
                                    type="text"
                                    name="gameName"
                                    value={formData.gameName}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    required
                                />
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label fw-medium">Game Logo (Upload)</label>
                                <input
                                    key={fileInputKey}
                                    type="file"
                                    name="gameLogo"
                                    onChange={handleInputChange}
                                    className="form-control"
                                    accept="image/*"
                                />
                                {formData.gameLogoPreview && (
                                    <div className="mt-2">
                                        <img
                                            src={formData.gameLogoPreview}
                                            alt="Logo Preview"
                                            style={{ height: '40px', width: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                                        />
                                        <span className="ms-2 text-muted small">New image selected</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label fw-medium">Iframe URL (embed link)</label>
                                <input
                                    type="text"
                                    name="iframs"
                                    value={formData.iframs}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="https://..."
                                    required
                                />
                            </div>
                            <div className="col-12 mt-4 d-grid gap-2 d-md-flex justify-content-md-start">
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-form-action px-5 py-2"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <div className="d-flex align-items-center justify-content-center gap-2">
                                            <GameLoader type="minimal" />
                                            {editingGame ? 'Updating...' : 'Adding...'}
                                        </div>
                                    ) : (
                                        editingGame ? 'Update Game' : 'Add Game'
                                    )}
                                </button>
                                {editingGame && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="btn btn-secondary btn-form-action px-5 py-2"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* ── Game List Card ── */}
                <div className="card shadow-sm mb-4">
                    <div className="card-header bg-white py-3 border-bottom">
                        <h3 className="mb-0 text-center text-bold">All Games</h3>
                    </div>

                    {/* ── MOBILE: card list (< 768px) ── */}
                    <div className="game-mobile-list">
                        {currentItems.length === 0 && (
                            <div className="text-center py-4 text-muted">
                                <p className="mb-0">No games found.</p>
                            </div>
                        )}
                        {currentItems.map(game => (
                            <div className="game-card-item" key={game._id}>
                                <img
                                    className="game-card-logo"
                                    src={getLogoSrc(game)}
                                    alt={game.gameName}
                                    onError={(e) => {
                                        if (e.target.src.includes('localhost:5000')) {
                                            e.target.src = e.target.src.replace('http://localhost:5000', REMOTE_URL);
                                        } else {
                                            e.target.onerror = null;
                                            e.target.src = fallbackSvg(50);
                                        }
                                    }}
                                />
                                <div className="game-card-info">
                                    <div className="game-card-name text-truncate">
                                        {game.gameName}
                                    </div>
                                    <div>
                                        <span className={`status-badge ${game.status !== false ? 'active' : 'inactive'}`}>
                                            <span className="status-dot"></span>
                                            {game.status !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                                <div className="game-card-actions">
                                    {/* Status toggle */}
                                    <div className="form-check form-switch p-0 m-0 d-flex align-items-center">
                                        <input
                                            className="form-check-input m-0"
                                            type="checkbox"
                                            role="switch"
                                            checked={game.status !== false}
                                            onChange={() => handleToggleStatus(game._id)}
                                        />
                                    </div>
                                    {/* Actions dropdown */}
                                    <div className="dropdown">
                                        <button
                                            className={`btn btn-sm btn-outline-secondary ${openDropdownId === game._id ? 'show' : ''}`}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenDropdownId(openDropdownId === game._id ? null : game._id);
                                            }}
                                            style={{ padding: '4px 8px' }}
                                        >
                                            <i className="bi bi-three-dots-vertical"></i>
                                        </button>
                                        <ul
                                            className={`dropdown-menu shadow ${openDropdownId === game._id ? 'show' : ''}`}
                                            style={{
                                                position: 'absolute',
                                                right: 0,
                                                left: 'auto',
                                                top: '36px',
                                                display: openDropdownId === game._id ? 'block' : 'none',
                                                minWidth: '160px',
                                            }}
                                        >
                                            <li>
                                                <button
                                                    className="dropdown-item py-2"
                                                    onClick={() => { handleEdit(game); setOpenDropdownId(null); }}
                                                >
                                                    <i className="bi bi-pencil-square me-2 text-primary"></i> Edit
                                                </button>
                                            </li>
                                            {/* <li>
                                                <button
                                                    className="dropdown-item py-2"
                                                    onClick={() => { setViewingJson(game); setOpenDropdownId(null); }}
                                                >
                                                    <i className="bi bi-code-slash me-2 text-info"></i> Raw JSON
                                                </button>
                                            </li> */}
                                            <li><hr className="dropdown-divider" /></li>
                                            <li>
                                                <button
                                                    className="dropdown-item py-2 text-danger"
                                                    onClick={() => { handleDelete(game._id); setOpenDropdownId(null); }}
                                                >
                                                    <i className="bi bi-trash me-2"></i> Delete
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── DESKTOP: table (≥ 768px) ── */}
                    <div className="game-desktop-table card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr className="text-center">
                                        <th>Logo</th>
                                        <th>Name</th>
                                        <th className="d-none d-md-table-cell">URL</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-center">
                                    {currentItems.map(game => (
                                        <tr key={game._id}>
                                            <td>
                                                <img
                                                    src={getLogoSrc(game)}
                                                    alt={game.gameName}
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                    className="rounded"
                                                    onError={(e) => {
                                                        if (e.target.src.includes('localhost:5000')) {
                                                            e.target.src = e.target.src.replace('http://localhost:5000', REMOTE_URL);
                                                        } else {
                                                            e.target.onerror = null;
                                                            e.target.src = fallbackSvg(50);
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <div className="text-truncate mx-auto" style={{ maxWidth: '160px' }}>
                                                    <strong>{game.gameName}</strong>
                                                    <button
                                                        className="btn btn-sm btn-link p-0 ms-2 text-primary"
                                                        onClick={() => setViewingJson(game)}
                                                        title="View JSON"
                                                    >
                                                        <i className="bi bi-code-slash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="d-none d-md-table-cell">
                                                <small className="text-muted">
                                                    {Array.isArray(game.iframs) ? game.iframs.join(', ') : (game.iframs || 'N/A')}
                                                </small>
                                            </td>
                                            <td>
                                                <div className="form-check form-switch d-flex justify-content-center p-0 m-0">
                                                    <input
                                                        className="form-check-input"
                                                        style={{ marginLeft: '0' }}
                                                        type="checkbox"
                                                        role="switch"
                                                        checked={game.status !== false}
                                                        onChange={() => handleToggleStatus(game._id)}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <div className="dropdown">
                                                    <button
                                                        className={`btn btn-sm btn-outline-secondary dropdown-toggle ${openDropdownId === game._id ? 'show' : ''}`}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenDropdownId(openDropdownId === game._id ? null : game._id);
                                                        }}
                                                    >
                                                        <i className="bi bi-gear-fill me-1"></i> Edit
                                                    </button>
                                                    <ul
                                                        className={`dropdown-menu shadow ${openDropdownId === game._id ? 'show' : ''}`}
                                                        style={{
                                                            position: 'absolute',
                                                            inset: '0px 0px auto auto',
                                                            margin: '0px',
                                                            transform: 'translate(0px, 34px)',
                                                            display: openDropdownId === game._id ? 'block' : 'none'
                                                        }}
                                                    >
                                                        <li>
                                                            <button
                                                                className="dropdown-item py-2"
                                                                onClick={() => { handleEdit(game); setOpenDropdownId(null); }}
                                                            >
                                                                <i className="bi bi-pencil-square me-2 text-primary"></i> Edit
                                                            </button>
                                                        </li>
                                                        {/* <li>
                                                        <button
                                                            className="dropdown-item py-2"
                                                            onClick={() => { setViewingJson(game); setOpenDropdownId(null); }}
                                                        >
                                                            <i className="bi bi-code-slash me-2 text-info"></i> Raw JSON
                                                        </button>
                                                    </li> */}
                                                        <li><hr className="dropdown-divider" /></li>
                                                        <li>
                                                            <button
                                                                className="dropdown-item py-2 text-danger"
                                                                onClick={() => { handleDelete(game._id); setOpenDropdownId(null); }}
                                                            >
                                                                <i className="bi bi-trash me-2"></i> Delete
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── Pagination ── */}
                    {totalPages > 1 && (
                        <div className="card-footer bg-white py-3 border-top-0">
                            <nav aria-label="Page navigation">
                                <ul className="pagination justify-content-center mb-0 flex-wrap gap-1">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => paginate(currentPage - 1)}>Prev</button>
                                    </li>
                                    {[...Array(Math.min(5, totalPages))].map((_, i) => (
                                        <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => paginate(i + 1)}>{i + 1}</button>
                                        </li>
                                    ))}
                                    {totalPages > 5 && (
                                        <>
                                            <li className="page-item disabled">
                                                <span className="page-link">…</span>
                                            </li>
                                            <li className={`page-item ${currentPage === totalPages ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => paginate(totalPages)}>{totalPages}</button>
                                            </li>
                                        </>
                                    )}
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => paginate(currentPage + 1)}>Next</button>
                                    </li>
                                </ul>
                            </nav>
                            <div className="text-center mt-2 text-muted small">
                                Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, games.length)} of {games.length} games
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageGames;
