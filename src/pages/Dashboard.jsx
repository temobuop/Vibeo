/**
 * Dashboard.jsx  ─ Homepage "/"
 * ═══════════════════════════════════════════════════════════════
 * Premium streaming homepage:
 *  • Full-width hero spotlight banner (personalized or trending)
 *  • Unique horizontal carousel rows from diverse TMDB endpoints
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ── Reusable components ──────────────────────────────────────
import Header from '@/components/layout/Header';
import HeroBanner from '@/components/layout/HeroBanner';
import MovieRow from '@/components/layout/MovieRow';
import Footer from '@/components/layout/Footer';

// ── Data sources ──────────────────────────────────────────────
import { useHomePageData } from '@/hooks/useHomePageData';
import { useSpotlightMovies } from '@/hooks/useSpotlightMovies';
import { useMoodMatchMovies } from '@/hooks/useMoodMatchMovies';

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Diverse TMDB data for each row
    const { trending, nowPlaying, topRated, popular, upcoming, loading } = useHomePageData();

    const handleCardClick = (movie) => navigate(`/watch/${movie.id}`);

    // Personalized recommendations
    const { movies: spotlightMovies } = useSpotlightMovies();
    const { movies: moodMatches } = useMoodMatchMovies();

    // Effect for auto-scrolling to section
    useEffect(() => {
        if (!loading && location.hash) {
            const id = location.hash.replace('#', '');
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    const y = element.getBoundingClientRect().top + window.scrollY - 80;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }, 100);
        }
    }, [location.hash, loading]);

    return (
        <div className="page-wrapper">
            <Header />

            <main>
                <HeroBanner movies={spotlightMovies.length > 0 ? spotlightMovies : trending.slice(0, 5)} />

                <div className="rows-container">
                    {loading ? (
                        <div className="loading-center">
                            <div className="spinner" />
                            <p>Fetching latest from TMDB…</p>
                        </div>
                    ) : (
                        <>
                            <MovieRow
                                id="trending"
                                title="Trending This Week"
                                movies={trending}
                                onCardClick={handleCardClick}
                            />
                            <MovieRow
                                id="now-playing"
                                title="Now Playing in Theaters"
                                movies={nowPlaying}
                                onCardClick={handleCardClick}
                            />
                            <MovieRow
                                id="top-rated"
                                title="Top Rated of All Time"
                                movies={topRated}
                                onCardClick={handleCardClick}
                            />
                            {moodMatches && moodMatches.length > 0 && (
                                <MovieRow
                                    id="mood-match"
                                    title="AI Mood Matches"
                                    movies={moodMatches}
                                    onCardClick={handleCardClick}
                                    showBadge={true}
                                />
                            )}
                            <MovieRow
                                id="popular"
                                title="Popular Worldwide"
                                movies={popular}
                                onCardClick={handleCardClick}
                            />
                            <MovieRow
                                id="upcoming"
                                title="Coming Soon"
                                movies={upcoming}
                                onCardClick={handleCardClick}
                            />
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Dashboard;
