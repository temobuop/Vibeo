import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchTMDB } from './tmdbClient';
import { collection, query as firestoreQuery, where, getDocs, addDoc, deleteDoc, doc, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { stopWords } from "../utils/stopWords";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const modelLLM = import.meta.env.VITE_GEMINI_MODEL;

if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY is missing from environment variables!");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Helper function to normalize queries for better cache matching
export const normalizeSearchQuery = (query) => {
    // 1. Convert to lowercase
    let normalized = query.toLowerCase();

    // 2. Remove punctuation (keep only alphanumeric and spaces)
    normalized = normalized.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");

    // 3. Remove common stop words (imported from utils)

    // Split into words, filter out stop words, and sort alphabetically
    let words = normalized.split(" ").filter(word => word.length > 0 && !stopWords.has(word));

    // Remove duplicate words so "kid kid tails" becomes "kid tails"
    words = Array.from(new Set(words));

    // Sort words alphabetically so "kid 9 tails code" matches "code kid 9 tails"
    words.sort();

    // Re-join into a single string
    return words.join(" ");
};

export const fetchGeminiRecommendations = async (query) => {
    try {
        if (!apiKey) {
            throw new Error("Gemini API key is not configured");
        }

        // --- CACHE CHECK ---
        const normalizedQuery = normalizeSearchQuery(query);
        console.log(`[Gemini Cache] Original: "${query}" -> Normalized Key: "${normalizedQuery}"`);

        const cacheKey = `gemini_search_${normalizedQuery}`;
        const cachedResult = sessionStorage.getItem(cacheKey);

        if (cachedResult) {
            console.log(`[Gemini Cache Hit - Session] Loaded results for: "${query}"`);
            return JSON.parse(cachedResult);
        }

        // --- FIRESTORE CACHE CHECK ---
        try {
            const cacheRef = collection(db, "gemini_search_cache");
            const q = firestoreQuery(cacheRef, where("searchQuery", "==", normalizedQuery));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                console.log(`[Gemini Cache Hit - Firestore] Loaded results for: "${query}"`);
                const firestoreData = querySnapshot.docs[0].data();
                const titles = firestoreData.results;

                // Save to session storage for faster access next time
                sessionStorage.setItem(cacheKey, JSON.stringify(titles));
                return titles;
            }
        } catch (dbError) {
            console.error("Error checking Firestore cache:", dbError);
            // Continue to call Gemini even if cache check fails
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

                // Save to Firestore cache
                try {
                    // Double-check if it was added while Gemini was generating to prevent duplicates from parallel requests
                    const cacheRef = collection(db, "gemini_search_cache");
                    const q = firestoreQuery(cacheRef, where("searchQuery", "==", normalizedQuery));
                    const querySnapshot = await getDocs(q);

                    if (querySnapshot.empty) {
                        await addDoc(cacheRef, {
                            searchQuery: normalizedQuery,
                            results: titles,
                            timestamp: new Date()
                        });
                        console.log(`[Gemini Cache Miss - Firestore] Saved results for: "${query}"`);
                    } else {
                        console.log(`[Gemini Cache Avoided - Firestore] Results already exist for: "${query}", skipping write.`);
                    }
                } catch (dbError) {
                    console.error("Error saving to Firestore cache:", dbError);
                }

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

// ==========================================
// USER SEARCH HISTORY API
// ==========================================

export const saveUserSearchHistory = async (userId, query) => {
    if (!userId || !query || !query.trim()) return;

    try {
        const historyRef = collection(db, "users", userId, "search_history");

        // Check if this exact query already exists to avoid duplicates
        const q = firestoreQuery(historyRef, where("query", "==", query.trim().toLowerCase()));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const docId = snapshot.docs[0].id;
            // Delete the old one and recreate below so it has the freshest timestamp
            await deleteDoc(doc(db, "users", userId, "search_history", docId));
        }

        // Add the new search entry
        await addDoc(historyRef, {
            query: query.trim().toLowerCase(),
            timestamp: new Date()
        });

        // --- ENFORCE MAX HISTORY LIMIT (Keep only last 10) ---
        const limitQuery = firestoreQuery(historyRef, orderBy("timestamp", "desc"));
        const limitSnapshot = await getDocs(limitQuery);

        if (limitSnapshot.size > 10) {
            const docsToDelete = limitSnapshot.docs.slice(10);
            for (const docSnap of docsToDelete) {
                await deleteDoc(doc(db, "users", userId, "search_history", docSnap.id));
            }
        }

    } catch (error) {
        console.error("Error saving user search history:", error);
    }
};

export const getUserSearchHistory = async (userId) => {
    if (!userId) return [];

    try {
        const historyRef = collection(db, "users", userId, "search_history");
        const q = firestoreQuery(historyRef, orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching user search history:", error);
        return [];
    }
};

export const removeUserSearchHistory = async (userId, docId) => {
    if (!userId || !docId) return;

    try {
        await deleteDoc(doc(db, "users", userId, "search_history", docId));
    } catch (error) {
        console.error("Error removing user search history:", error);
    }
};
