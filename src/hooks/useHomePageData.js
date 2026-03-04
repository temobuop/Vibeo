/**
 * useHomePageData.js
 * ═══════════════════════════════════════════════════════════════
 * Fetches diverse content for the home page from multiple TMDB
 * endpoints in parallel. Each row gets genuinely unique movies.
 * ═══════════════════════════════════════════════════════════════
 */

import { useQuery } from '@tanstack/react-query';
import { fetchTMDB } from '../api/tmdbClient';

const fetchAllHomeData = async () => {
    const [trending, nowPlaying, topRated, popular, upcoming] = await Promise.all([
        fetchTMDB('/trending/movie/week'),
        fetchTMDB('/movie/now_playing'),
        fetchTMDB('/movie/top_rated'),
        fetchTMDB('/movie/popular'),
        fetchTMDB('/movie/upcoming'),
    ]);

    return {
        trending: trending?.results || [],
        nowPlaying: nowPlaying?.results || [],
        topRated: topRated?.results || [],
        popular: popular?.results || [],
        upcoming: upcoming?.results || [],
    };
};

export const useHomePageData = () => {
    const { data, isLoading: loading, error } = useQuery({
        queryKey: ['homePageData'],
        queryFn: fetchAllHomeData,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
        trending: data?.trending || [],
        nowPlaying: data?.nowPlaying || [],
        topRated: data?.topRated || [],
        popular: data?.popular || [],
        upcoming: data?.upcoming || [],
        loading,
        error,
    };
};
