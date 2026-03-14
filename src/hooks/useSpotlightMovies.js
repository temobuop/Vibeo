import { useState, useEffect } from 'react';
import { fetchTMDB } from '../api/tmdbClient';
import { useUserMoviesContext } from '../context/UserMoviesContext';

export const useSpotlightMovies = () => {
    const { favoriteMovies } = useUserMoviesContext();
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        const fetchSpotlight = async () => {
            try {
                if (favoriteMovies && favoriteMovies.length > 0) {
                    // Extract unique genres from favorite movies
                    const genreCounts = {};
                    favoriteMovies.forEach(m => {
                        (m.genre_ids || []).forEach(gId => {
                            genreCounts[gId] = (genreCounts[gId] || 0) + 1;
                        });
                    });

                    // Sort genres by frequency and pick the top 3
                    const topGenres = Object.keys(genreCounts)
                        .sort((a, b) => genreCounts[b] - genreCounts[a])
                        .slice(0, 3)
                        .join(',');

                    if (topGenres) {
                        // Fetch discover API matching these genres
                        const res = await fetchTMDB('/discover/movie', {
                            with_genres: topGenres,
                            sort_by: 'popularity.desc',
                            page: 1
                        });

                        // Filter out the actual favorites so we don't just show them what they clicked
                        const favIds = new Set(favoriteMovies.map(f => f.id));
                        const recommended = (res?.results || []).filter(m => !favIds.has(m.id)).slice(0, 5);

                        // If we found enough recommendations, set them
                        if (recommended.length >= 3) {
                            if (isMounted) {
                                setMovies(recommended);
                                setLoading(false);
                            }
                            return;
                        }
                    }
                }

                // Fallback: If no favorites or API fetch failed, return generic trending
                const fallbackRes = await fetchTMDB('/trending/movie/week');
                if (isMounted) {
                    setMovies((fallbackRes?.results || []).slice(0, 5));
                }
            } catch (error) {
                console.error("Error fetching spotlight movies:", error);
                if (isMounted) {
                    // Ultimate fallback
                    const fallbackRes = await fetchTMDB('/trending/movie/week');
                    setMovies((fallbackRes?.results || []).slice(0, 5));
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchSpotlight();

        return () => {
            isMounted = false;
        };
    }, [favoriteMovies]); // Re-fetch if favorites change updates!

    return { movies, loading };
};
