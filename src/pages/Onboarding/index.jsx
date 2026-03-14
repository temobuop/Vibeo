import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserMoviesContext } from '@/context/UserMoviesContext';
import { useOnboardingSearch } from '@/hooks/useOnboardingSearch';
import './styles.css';

const Onboarding = () => {
    const { currentUser } = useAuth();
    const { saveOnboardingData } = useUserMoviesContext();
    const { query, setQuery, movies, loading, hasMore, loadMore } = useOnboardingSearch();
    const navigate = useNavigate();

    // Steps: 1 = Favorites, 2 = Seen
    const [step, setStep] = useState(1);

    // Row limiting: Initially show only 3 rows (approx 18 movies)
    // If the user hasn't searched, we show the defaults. 
    // If they have searched, we show all search results but with the load more button.
    const [limitRows, setLimitRows] = useState(true);

    const INITIAL_ITEM_LIMIT = 18; // approx 3 rows of 6

    // Filtered/Limited movies
    const displayedMovies = useMemo(() => {
        if (limitRows && movies.length > INITIAL_ITEM_LIMIT) {
            return movies.slice(0, INITIAL_ITEM_LIMIT);
        }
        return movies;
    }, [movies, limitRows]);

    // Data Accumulators
    const [favorites, setFavorites] = useState([]);
    const [seen, setSeen] = useState([]);
    const [saving, setSaving] = useState(false);

    // If not logged in, redirect home
    if (!currentUser) {
        navigate('/');
        return null;
    }

    const toggleFavorite = (movie) => {
        const isSelected = favorites.some(m => m.id === movie.id);
        if (isSelected) {
            setFavorites(favorites.filter(m => m.id !== movie.id));
        } else if (favorites.length < 5) {
            setFavorites([...favorites, movie]);
        }
    };

    const toggleSeen = (movie) => {
        const isSelected = seen.some(m => m.id === movie.id);
        if (isSelected) {
            setSeen(seen.filter(m => m.id !== movie.id));
        } else {
            setSeen([...seen, movie]);
        }
    };

    const handleNextStep = () => {
        if (favorites.length >= 3 && step === 1) {
            setStep(2);
            setQuery(''); // Reset search when changing steps
            setLimitRows(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevStep = () => {
        if (step === 2) {
            setStep(1);
            setQuery('');
            setLimitRows(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleFinish = async () => {
        setSaving(true);
        try {
            await saveOnboardingData({ favorites, seen });
            navigate('/');
        } catch (error) {
            console.error("Failed to save preferences:", error);
            setSaving(false);
        }
    };

    const handleShowMoreResults = () => {
        if (limitRows && movies.length > INITIAL_ITEM_LIMIT) {
            setLimitRows(false);
        } else if (hasMore) {
            loadMore();
        }
    };

    // Derived props based on step
    const isStep1 = step === 1;
    const currentSelections = isStep1 ? favorites : seen;
    const canProceedStep1 = favorites.length >= 3;

    // Determine if we should show the "Load More" button
    const showLoadMoreAction = (limitRows && movies.length > INITIAL_ITEM_LIMIT) || hasMore;

    return (
        <div className="onboarding-page">
            <main className="onboarding-main">
                <div className="onboarding-header">
                    {/* Progress Indicator */}
                    <div className="onboarding-steps">
                        <div className={`step-indicator active`}>1</div>
                        <div className={`step-line ${step === 2 ? 'active' : ''}`} />
                        <div className={`step-indicator ${step === 2 ? 'active' : ''}`}>2</div>
                    </div>

                    <h1 className="onboarding-title">
                        {isStep1 ? 'What are your absolute favorites?' : 'What movies have you seen?'}
                    </h1>

                    <p className="onboarding-subtitle">
                        {isStep1 ? (
                            <>Select <strong>3 to 5</strong> movies you love. ({favorites.length}/5)</>
                        ) : (
                            <>Select movies you've already watched to build your library. ({seen.length} selected)</>
                        )}
                    </p>
                </div>

                {/* Search Bar */}
                <div className="onboarding-search-container">
                    <svg className="search-icon-overlay" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        className="onboarding-search"
                        placeholder="Search for movies..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <div className="onboarding-grid">
                    {displayedMovies.map((movie) => {
                        const isSelected = currentSelections.some(m => m.id === movie.id);
                        const isFavoriteStep = isStep1;

                        return (
                            <button
                                key={movie.id}
                                onClick={() => isFavoriteStep ? toggleFavorite(movie) : toggleSeen(movie)}
                                type="button"
                                className={`onboarding-movie-card ${isSelected ? 'selected' : ''}`}
                            >
                                <img
                                    src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                                    alt={movie.title}
                                    className="onboarding-movie-img"
                                    loading="lazy"
                                />

                                <div className="movie-info-overlay">
                                    <h3 className="movie-info-title">
                                        {movie.title}
                                    </h3>
                                    {movie.release_date && (
                                        <span className="movie-info-year">
                                            {new Date(movie.release_date).getFullYear()}
                                        </span>
                                    )}
                                </div>

                                {isSelected && (
                                    <div className={`onboarding-checkmark ${isFavoriteStep ? 'heart' : ''}`}>
                                        {isFavoriteStep ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {loading && (
                    <div className="onboarding-loading" style={{ height: '100px' }}>
                        <div className="onboarding-spinner" />
                    </div>
                )}

                {showLoadMoreAction && !loading && (
                    <div className="onboarding-pagination-bar">
                        <button
                            className="onboarding-btn onboarding-btn-secondary"
                            onClick={handleShowMoreResults}
                        >
                            Load More
                        </button>
                    </div>
                )}
            </main>

            {/* Sticky Bottom Bar */}
            <div className="onboarding-bottom-bar">
                {step === 2 && (
                    <button
                        className="onboarding-btn onboarding-btn-secondary"
                        onClick={handlePrevStep}
                        disabled={saving}
                    >
                        Back
                    </button>
                )}

                {isStep1 ? (
                    <button
                        onClick={handleNextStep}
                        disabled={!canProceedStep1}
                        className={`onboarding-btn onboarding-continue-btn ${canProceedStep1 ? 'active' : ''}`}
                    >
                        Continue
                    </button>
                ) : (
                    <button
                        onClick={handleFinish}
                        disabled={saving}
                        className={`onboarding-btn onboarding-continue-btn active ${saving ? 'saving' : ''}`}
                    >
                        {saving ? 'Saving...' : 'Finish Onboarding'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Onboarding;
