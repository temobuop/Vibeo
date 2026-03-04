import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchTMDB } from './tmdbClient';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const modelLLM = import.meta.env.VITE_GEMINI_MODEL;

if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY is missing from environment variables!");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const fetchGeminiRecommendations = async (query) => {
    try {
        if (!apiKey) {
            throw new Error("Gemini API key is not configured");
        }

        // --- CACHE CHECK ---
        const cacheKey = `gemini_search_${query.trim().toLowerCase()}`;
        const cachedResult = sessionStorage.getItem(cacheKey);

        if (cachedResult) {
            console.log(`[Gemini Cache Hit] Loaded results for: "${query}"`);
            return JSON.parse(cachedResult);
        }
        // -------------------

        // We use gemini-3-flash-preview as it's the fastest text model
        const model = genAI.getGenerativeModel({ model: modelLLM });

        const prompt = `
            You are a movie recommendation engine for a streaming app. 
            The user's search query is: "${query}"

            Based on this query, please recommend 5 to 10 movie or TV show titles that perfectly match what they are looking for.
            If the query is already an exact movie title (e.g., "Inception"), just return that title and some similar movies.
            If the query is descriptive (e.g., "funny movies from the 90s"), return the best matches.

            CRITICAL INSTRUCTION: You MUST return ONLY a valid JSON array of strings containing the titles. Do not include markdown formatting, backticks, or any other explanations. 
            Just the raw JSON array.

            Example response format:
            ["Title 1", "Title 2", "Title 3"]
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Try to parse the response as JSON. We remove common markdown code block syntaxes just in case.
        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

        try {
            const titles = JSON.parse(cleanedText);
            if (Array.isArray(titles)) {
                // Save successful result to cache
                sessionStorage.setItem(cacheKey, JSON.stringify(titles));
                return titles;
            }
            throw new Error("Gemini did not return an array");
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", cleanedText);
            throw new Error("Invalid format received from AI");
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        return []; // Return an empty array on failure so it doesn't break the app
    }
};

export const analyzeTastePreferences = async (watchedMovies, lovedMovies) => {
    try {
        if (!apiKey) {
            throw new Error("Gemini API key is not configured");
        }
        const model = genAI.getGenerativeModel({ model: modelLLM });

        const watchedTitles = watchedMovies.map(m => m.title || m.name).join(", ");
        const lovedTitles = lovedMovies.map(m => m.title || m.name).join(", ");

        const prompt = `
            You are a master film critic and expert movie recommendation engine for a premium streaming app.
            The user has watched these movies/shows: ${watchedTitles}
            The user ABSOLUTELY LOVES these movies/shows: ${lovedTitles}

            Based on the nuanced themes, tropes, pacing, aesthetics, directors, and underlying vibes of the movies they LOVE (and taking into account what they have already watched so you DO NOT recommend those), recommend exactly 8 carefully curated movies or TV shows that perfectly match their specific taste profile.
            
            CRITICAL INSTRUCTION: Return ONLY a valid JSON array of exact strings containing the recommended titles. Do not include markdown formatting, backticks, explanations, or numbering. Just the raw JSON array.
            
            Example format:
            ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5", "Title 6", "Title 7", "Title 8"]
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

        try {
            const titles = JSON.parse(cleanedText);
            if (Array.isArray(titles)) {
                return titles;
            }
            throw new Error("Gemini did not return an array");
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", cleanedText);
            throw new Error("Invalid format received from AI");
        }
    } catch (error) {
        console.warn("Gemini API Error or Quota Exceeded. Falling back to TMDB Smart Algorithm...", error);

        try {
            // --- TMDB FALLBACK ALGORITHM ---
            const genreCounts = {};
            lovedMovies.forEach(m => {
                (m.genre_ids || []).forEach(g => {
                    genreCounts[g] = (genreCounts[g] || 0) + 1;
                });
            });

            const topGenres = Object.entries(genreCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 2)
                .map(entry => entry[0])
                .join(',');

            const discoverParams = {
                with_genres: topGenres,
                sort_by: 'popularity.desc',
                page: 1,
                'vote_count.gte': 100 // ensure some quality
            };

            const data = await fetchTMDB('/discover/movie', discoverParams);

            if (data && data.results) {
                const watchedIds = new Set(watchedMovies.map(m => m.id));
                const lovedIds = new Set(lovedMovies.map(m => m.id));

                const fallbackTitles = data.results
                    .filter(m => !watchedIds.has(m.id) && !lovedIds.has(m.id))
                    .map(m => m.title || m.name)
                    .slice(0, 8);

                if (fallbackTitles.length > 0) return fallbackTitles;
            }
        } catch (fallbackError) {
            console.error("TMDB Fallback also failed:", fallbackError);
        }

        return [];
    }
};
