import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserMoviesContext } from '@/context/UserMoviesContext';
import { useNavigate } from 'react-router-dom';
import MovieCard from '@/components/common/MovieCard';
import './styles.css';

const Library = () => {
    const { currentUser } = useAuth();
    const { watchlist, updateWatchlistStatus, removeFromWatchlist, continueWatching, removeFromContinueWatching, loading } = useUserMoviesContext();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [managingId, setManagingId] = useState(null);
    const [visibleItems, setVisibleItems] = useState(20);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const menuRef = useRef(null);
    const dropdownRef = useRef(null);

    // Filter watchlist based on active tab
    // Unified data merging and filtering logic
    const getFilteredItems = useCallback(() => {
        if (activeTab === 'all') return watchlist;

        if (activeTab === 'watching') {
            const watchingFromWatchlist = watchlist.filter(m => (m.status || 'planning') === 'watching');
            
            // Map to deduplicate by ID
            const mergedMap = new Map();
            
            // Add movies from continueWatching first (they represent actual progress)
            continueWatching.forEach(movie => {
                mergedMap.set(movie.id, { ...movie, status: 'watching' });
            });
            
            // Add movies explicitly marked as 'watching' in watchlist
            watchingFromWatchlist.forEach(movie => {
                if (!mergedMap.has(movie.id)) {
                    mergedMap.set(movie.id, movie);
                }
            });
            
            return Array.from(mergedMap.values()).sort((a, b) => 
                (b.timestamp || b.updatedAt || b.addedAt || 0) - (a.timestamp || a.updatedAt || a.addedAt || 0)
            );
        }

        return watchlist.filter(movie => (movie.status || 'planning') === activeTab);
    }, [activeTab, watchlist, continueWatching]);

    const filteredWatchlist = getFilteredItems();

    // Reset pagination when tab changes
    useEffect(() => {
        setVisibleItems(20);
    }, [activeTab]);

    const displayedWatchlist = filteredWatchlist.slice(0, visibleItems);
    const hasMore = visibleItems < filteredWatchlist.length;

    // Infinite scroll observer
    const observer = useRef();
    const lastElementRef = useCallback(node => {
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setVisibleItems(prev => prev + 20);
            }
        });
        if (node) observer.current.observe(node);
    }, [hasMore]);

    // Close managing menu on Escape key or outside click
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setManagingId(null);
        };

        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setManagingId(null);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Tab configuration
    const tabs = [
        { id: 'all', label: 'All', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg> },
        { id: 'watching', label: 'Watching', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> },
        { id: 'planning', label: 'Planning to Watch', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> },
        { id: 'completed', label: 'Completed', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> },
        { id: 'on_hold', label: 'On Hold', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> },
    ];

    return (
        <div className="page-wrapper library-page fade-in">
            <main className="library-main">
                <header className="library-header">
                    <div className="library-header-content">
                        <h1>My Library</h1>
                        <p className="library-subtitle">
                            {watchlist.length} {watchlist.length === 1 ? 'item' : 'items'} in your collection
                        </p>
                    </div>

                    {/* Continue Watching Section */}


                    <div className="library-nav-container">
                        {/* Desktop Tabs */}
                        <div className="watchlist-tabs desktop-only">
                            {tabs.map(tab => {
                                const count = tab.id === 'all'
                                    ? watchlist.length
                                    : tab.id === 'watching'
                                        ? (() => {
                                            const watchingInWl = watchlist.filter(m => (m.status || 'planning') === 'watching').map(m => m.id);
                                            const cwIds = continueWatching.map(m => m.id);
                                            return new Set([...watchingInWl, ...cwIds]).size;
                                        })()
                                        : watchlist.filter(m => (m.status || 'planning') === tab.id).length;

                                return (
                                    <button
                                        key={tab.id}
                                        className={`watchlist-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                        role="tab"
                                        aria-selected={activeTab === tab.id}
                                    >
                                        <span className="tab-icon">{tab.icon}</span>
                                        <span className="tab-label">{tab.label}</span>
                                        <span className="tab-count">{count}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Mobile Dropdown */}
                        <div className="library-mobile-nav mobile-only" ref={dropdownRef}>
                            <button 
                                className={`library-dropdown-trigger ${isDropdownOpen ? 'active' : ''}`}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <div className="trigger-left">
                                    <span className="current-tab-icon">
                                        {tabs.find(t => t.id === activeTab)?.icon}
                                    </span>
                                    <span className="current-tab-label">
                                        {tabs.find(t => t.id === activeTab)?.label}
                                    </span>
                                </div>
                                <div className="trigger-right">
                                    <span className="current-tab-count">
                                        {activeTab === 'all' 
                                            ? watchlist.length 
                                            : activeTab === 'watching'
                                                ? (() => {
                                                    const watchingInWl = watchlist.filter(m => (m.status || 'planning') === 'watching').map(m => m.id);
                                                    const cwIds = continueWatching.map(m => m.id);
                                                    return new Set([...watchingInWl, ...cwIds]).size;
                                                })()
                                                : watchlist.filter(m => (m.status || 'planning') === activeTab).length
                                        }
                                    </span>
                                    <svg className={`chevron-icon ${isDropdownOpen ? 'open' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </div>
                            </button>

                            {isDropdownOpen && (
                                <div className="library-dropdown-menu fade-in">
                                    {tabs.map(tab => {
                                        const count = tab.id === 'all'
                                            ? watchlist.length
                                            : tab.id === 'watching'
                                                ? (() => {
                                                    const watchingInWl = watchlist.filter(m => (m.status || 'planning') === 'watching').map(m => m.id);
                                                    const cwIds = continueWatching.map(m => m.id);
                                                    return new Set([...watchingInWl, ...cwIds]).size;
                                                })()
                                                : watchlist.filter(m => (m.status || 'planning') === tab.id).length;

                                        return (
                                            <button
                                                key={`dropdown-${tab.id}`}
                                                className={`dropdown-item ${activeTab === tab.id ? 'active' : ''}`}
                                                onClick={() => {
                                                    setActiveTab(tab.id);
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                <span className="item-icon">{tab.icon}</span>
                                                <span className="item-label">{tab.label}</span>
                                                <span className="item-count">{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <section className="library-content">
                    {displayedWatchlist.length === 0 ? (
                        <div className="dashboard-empty fade-in">
                            <div className="empty-icon-wrapper">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                            </div>
                            <h3>Your {activeTab === 'all' ? 'library' : activeTab.replace('_', ' ')} is empty</h3>
                            <p>Start adding movies to build your cinematic DNA.</p>
                            <button className="empty-cta-btn" onClick={() => navigate('/discover/trending')}>
                                Start Exploring
                            </button>
                        </div>
                    ) : (
                        <div className="dashboard-grid">
                            {displayedWatchlist.map((movie, index) => (
                                <div
                                    key={`wl-wrapper-${movie.id}`}
                                    className="card-manage-wrapper"
                                    ref={index === displayedWatchlist.length - 1 ? lastElementRef : null}
                                >
                                    <div
                                        className={`card-actions-dropdown ${managingId === movie.id ? 'active' : ''}`}
                                        ref={managingId === movie.id ? menuRef : null}
                                    >
                                        <button
                                            className="card-manage-trigger"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setManagingId(managingId === movie.id ? null : movie.id);
                                            }}
                                            aria-label="Manage movie status"
                                            aria-expanded={managingId === movie.id}
                                            aria-haspopup="true"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                                        </button>

                                        {managingId === movie.id && (
                                                <div className="manage-menu fade-in">
                                                    <div className="manage-menu-section">
                                                        <span className="manage-menu-label">Move to</span>
                                                        <button className="manage-menu-item" onClick={() => { updateWatchlistStatus(movie, 'watching'); setManagingId(null); }}>
                                                            <span className="manage-icon">{tabs.find(t => t.id === 'watching').icon}</span>
                                                            Watching
                                                        </button>
                                                        <button className="manage-menu-item" onClick={() => { updateWatchlistStatus(movie, 'planning'); setManagingId(null); }}>
                                                            <span className="manage-icon">{tabs.find(t => t.id === 'planning').icon}</span>
                                                            Planning
                                                        </button>
                                                        <button className="manage-menu-item" onClick={() => { updateWatchlistStatus(movie, 'completed'); setManagingId(null); }}>
                                                            <span className="manage-icon">{tabs.find(t => t.id === 'completed').icon}</span>
                                                            Completed
                                                        </button>
                                                        <button className="manage-menu-item" onClick={() => { updateWatchlistStatus(movie, 'on_hold'); setManagingId(null); }}>
                                                            <span className="manage-icon">{tabs.find(t => t.id === 'on_hold').icon}</span>
                                                            On Hold
                                                        </button>
                                                    </div>
                                                    <div className="manage-menu-divider"></div>
                                                    <button className="manage-menu-remove" onClick={() => { removeFromWatchlist(movie); setManagingId(null); }}>
                                                        <span className="manage-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
                                                        Remove from Library
                                                    </button>
                                                </div>
                                        )}
                                    </div>
                                    <MovieCard
                                        movie={movie}
                                        onClick={(m) => navigate(`/watch/${m.id}?type=${m.media_type || 'movie'}`)}
                                        animationDelay={`${index % 20 * 40}ms`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Library;
