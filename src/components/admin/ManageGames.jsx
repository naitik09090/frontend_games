import React, { useState, useEffect } from 'react';

const ManageGames = () => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingGame, setEditingGame] = useState(null);
    const [formData, setFormData] = useState({
        gameName: '',
        gameLogo: null,
        iframs: ''
    });
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://backend-games-zeta-eight.vercel.app';

    useEffect(() => {
        fetchGames();

        const closeDropdowns = () => setOpenDropdownId(null);
        window.addEventListener('click', closeDropdowns);
        return () => window.removeEventListener('click', closeDropdowns);
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
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const fd = new FormData();
            fd.append('gameName', formData.gameName);
            if (formData.gameLogo) {
                fd.append('gameLogo', formData.gameLogo);
            }
            fd.append('gameUrl', formData.iframs);
            fd.append('iframs', formData.iframs);

            const url = editingGame ? `${API_URL}/games/${editingGame._id}` : `${API_URL}/games`;
            const method = editingGame ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                body: fd,
            });

            if (!response.ok) throw new Error(`Failed to ${editingGame ? 'update' : 'add'} game`);

            await fetchGames();
            resetForm();
            alert(`Game ${editingGame ? 'updated' : 'added'} successfully!`);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this game?')) return;
        try {
            const response = await fetch(`${API_URL}/games/${id}`, {
                method: 'DELETE',
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
            gameLogo: null, // We handle files separately
            iframs: game.iframs || ''
        });
        window.scrollTo(0, 0);
    };

    const resetForm = () => {
        setEditingGame(null);
        setFormData({ gameName: '', gameLogo: null, iframs: '' });
    };

    const handleToggleStatus = async (id) => {
        try {
            const response = await fetch(`${API_URL}/games/${id}/toggle-status`, {
                method: 'PATCH',
            });
            if (!response.ok) throw new Error('Failed to toggle status');
            const data = await response.json();
            setGames(prev => prev.map(g => g._id === id ? { ...g, status: data.status } : g));
        } catch (err) {
            alert(err.message);
        }
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = games.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(games.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;

    return (
        <div className="container-fluid">
            <style>
                {`
                .form-switch .form-check-input {
                    width: 3.5em;
                    height: 1.8em;
                    cursor: pointer;
                }
                .form-switch .form-check-input:checked {
                    background-color: #0d6efd;
                    border-color: #0d6efd;
                }
                
                /* Hide scrollbar but keep functionality */
                *::-webkit-scrollbar {
                    display: none !important;
                }
                * {
                    -ms-overflow-style: none !important;
                    scrollbar-width: none !important;
                }

                /* Fix dropdown menu being clipped by table-responsive */
                .table-responsive {
                    overflow: visible !important;
                }

                .dropdown-menu {
                    z-index: 1050;
                }
                `}
            </style>
            <h1 className="mb-4">Manage Games</h1>

            {/* Addition/Edit Form */}
            <div className="card shadow-sm mb-5">
                <div className="card-body">
                    <h5 className="card-title mb-3">{editingGame ? 'Edit Game' : 'Add New Game'}</h5>
                    <form onSubmit={handleSubmit} className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label">Game Name</label>
                            <input type="text" name="gameName" value={formData.gameName} onChange={handleInputChange} className="form-control" required />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Game Logo {editingGame && '(Leave blank to keep current)'}</label>
                            <input type="file" name="gameLogo" onChange={handleInputChange} className="form-control" accept="image/*" />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Iframe URL</label>
                            <input type="url" name="iframs" value={formData.iframs} onChange={handleInputChange} className="form-control" required />
                        </div>
                        <div className="col-12 mt-4">
                            <button type="submit" className="btn btn-primary me-2 px-4">
                                {editingGame ? 'Update Game' : 'Add Game'}
                            </button>
                            {editingGame && (
                                <button type="button" onClick={resetForm} className="btn btn-secondary px-4">Cancel</button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Game List Table */}
            <div className="card shadow-sm">
                <div className="card-header bg-white py-3">
                    <h5 className="mb-0 text-center">All Games</h5>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr className='text-center'>
                                    <th>Logo</th>
                                    <th>Name</th>
                                    <th>URL</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody className='text-center'>
                                {currentItems.map(game => (
                                    <tr key={game._id}>
                                        <td>
                                            <img
                                                src={game.gameLogo?.startsWith('http') ? game.gameLogo : `${API_URL}${game.gameLogo?.startsWith('/') ? '' : '/'}${game.gameLogo}`}
                                                alt={game.gameName || game.gameName}
                                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                className="rounded"
                                                onError={(e) => {
                                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50"%3E%3Crect fill="%23ddd" width="50" height="50"/%3E%3Ctext fill="%23999" font-size="10" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Img%3C/text%3E%3C/svg%3E';
                                                }}
                                            />
                                        </td>
                                        <td><strong>{game.gameName}</strong></td>
                                        <td><small className="text-muted">{game.iframs || 'N/A'}</small></td>
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
                                                    <i className="bi bi-pencil-square me-2 text-primary"></i> Edit
                                                </button>
                                                <ul className={`dropdown-menu shadow ${openDropdownId === game._id ? 'show' : ''}`}
                                                    style={{
                                                        position: 'absolute',
                                                        inset: '0px 0px auto auto',
                                                        margin: '0px',
                                                        transform: 'translate(0px, 34px)',
                                                        display: openDropdownId === game._id ? 'block' : 'none'
                                                    }}
                                                >
                                                    <li>
                                                        <button className="dropdown-item py-2" onClick={() => { handleEdit(game); setOpenDropdownId(null); }}>
                                                            <i className="bi bi-pencil-square me-2 text-primary"></i> Edit
                                                        </button>
                                                    </li>
                                                    <li><hr className="dropdown-divider" /></li>
                                                    <li>
                                                        <button className="dropdown-item py-2 text-danger" onClick={() => { handleDelete(game._id); setOpenDropdownId(null); }}>
                                                            <i className="bi bi-trash me-2"></i> Delete
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {/* <tbody className='text-center'>
                                {currentItems.map(game => (
                                    <tr key={game._id}>
                                        <td>
                                            <img
                                                src={game.image?.startsWith('http') ? game.image : `${API_URL}${game.image?.startsWith('/') ? '' : '/'}${game.image}`}
                                                alt={game.name || game.game_name}
                                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                className="rounded"
                                                onError={(e) => {
                                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50"%3E%3Crect fill="%23ddd" width="50" height="50"/%3E%3Ctext fill="%23999" font-size="10" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Img%3C/text%3E%3C/svg%3E';
                                                }}
                                            />
                                        </td>
                                        <td><strong>{game.game_name}</strong></td>
                                        <td><small className="text-muted">{game.file || 'N/A'}</small></td>
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
                                                    <i className="bi bi-pencil-square me-2 text-primary"></i> Edit
                                                </button>
                                                <ul className={`dropdown-menu shadow ${openDropdownId === game._id ? 'show' : ''}`}
                                                    style={{
                                                        position: 'absolute',
                                                        inset: '0px 0px auto auto',
                                                        margin: '0px',
                                                        transform: 'translate(0px, 34px)',
                                                        display: openDropdownId === game._id ? 'block' : 'none'
                                                    }}
                                                >
                                                    <li>
                                                        <button className="dropdown-item py-2" onClick={() => { handleEdit(game); setOpenDropdownId(null); }}>
                                                            <i className="bi bi-pencil-square me-2 text-primary"></i> Edit
                                                        </button>
                                                    </li>
                                                    <li><hr className="dropdown-divider" /></li>
                                                    <li>
                                                        <button className="dropdown-item py-2 text-danger" onClick={() => { handleDelete(game._id); setOpenDropdownId(null); }}>
                                                            <i className="bi bi-trash me-2"></i> Delete
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody> */}
                        </table>
                    </div>
                </div>
                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="card-footer bg-white py-3">
                        <nav aria-label="Page navigation">
                            <ul className="pagination justify-content-center mb-0">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => paginate(currentPage - 1)}>Previous</button>
                                </li>
                                {[...Array(Math.min(5, totalPages))].map((_, i) => (
                                    <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                        <button className="page-link" onClick={() => paginate(i + 1)}>{i + 1}</button>
                                    </li>
                                ))}
                                {totalPages > 5 && (
                                    <>
                                        <li className="page-item disabled">
                                            <span className="page-link">...</span>
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
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, games.length)} of {games.length} games
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageGames;
