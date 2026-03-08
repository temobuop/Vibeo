import React, { useMemo, useState } from 'react';
import { formatWatchTime } from '@/utils/timeUtils';
import './styles.css';

const VibeStats = ({ watchlist = [], favorites = [], totalWatchTime, isHeaderVariant = false }) => {
    // 1. Define Taste Dimensions and Map Genres
    const dimensions = useMemo(() => [
        {
            key: 'adrenaline',
            label: 'Adrenaline',
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
            genres: [28, 12, 53, 37]
        },
        {
            key: 'heart',
            label: 'Heart',
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
            genres: [18, 10749, 10751, 10402]
        },
        {
            key: 'imagination',
            label: 'Imagination',
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>,
            genres: [878, 14, 16]
        },
        {
            key: 'reality',
            label: 'Reality',
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>,
            genres: [99, 36, 80, 9648, 10752]
        },
        {
            key: 'vibe',
            label: 'Vibe',
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
            genres: [35, 10770]
        },
    ], []);

    const [activeDimension, setActiveDimension] = useState(null);

    const analyzedMovies = useMemo(() => watchlist.filter(m => m.status === 'completed'), [watchlist]);

    // 2. Calculate Dimension Scores and Movie Mapping
    const stats = useMemo(() => {

        const scores = { adrenaline: 0, heart: 0, imagination: 0, reality: 0, vibe: 0 };
        const mapping = { adrenaline: [], heart: [], imagination: [], reality: [], vibe: [] };
        let maxCount = 0;

        analyzedMovies.forEach(movie => {
            if (movie.genre_ids) {
                movie.genre_ids.forEach(genreId => {
                    dimensions.forEach(dim => {
                        if (dim.genres.includes(genreId)) {
                            scores[dim.key]++;
                            // Keep track of unique movies per dimension
                            if (!mapping[dim.key].some(m => m.id === movie.id)) {
                                mapping[dim.key].push(movie);
                            }
                        }
                    });
                });
            }
        });

        // Find max for scaling
        Object.values(scores).forEach(val => { if (val > maxCount) maxCount = val; });

        // Normalize to 0-100 range and attach movie details
        return dimensions.map(dim => ({
            ...dim,
            value: maxCount > 0 ? Math.max(15, (scores[dim.key] / maxCount) * 100) : 20,
            raw: scores[dim.key],
            movies: mapping[dim.key],
            percentage: maxCount > 0 ? Math.round((scores[dim.key] / Object.values(scores).reduce((a, b) => a + b, 0)) * 100) : 20
        }));
    }, [watchlist, dimensions]);

    // Persona mapping based on dominant trait
    const personaMap = {
        adrenaline: { title: "The Thrill-Seeker", desc: "You thrive on high stakes, fast pacing, and explosive action sequences." },
        heart: { title: "The Empath", desc: "You connect deeply with character-driven stories and emotional resonance." },
        imagination: { title: "The Dreamer", desc: "You escape into extraordinary worlds of fantasy, sci-fi, and animation." },
        reality: { title: "The Truth-Finder", desc: "You prefer grounded stories, historical depth, and complex crime or mystery." },
        vibe: { title: "The Light-Hearted", desc: "You prefer comedies and feel-good stories to keep the mood elevated." }
    };

    const dominantTrait = [...stats].sort((a, b) => b.raw - a.raw)[0];
    const persona = personaMap[dominantTrait?.key] || { title: "The Explorer", desc: "You are currently building your cinematic identity." };

    const [showFullBreakdown, setShowFullBreakdown] = useState(false);

    // 3. SVG Radar Chart Points Calculation
    const size = 320;
    const center = size / 2;
    const radius = size * 0.35;

    const getPoint = (index, total, value) => {
        const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
        const x = center + (radius * (value / 100)) * Math.cos(angle);
        const y = center + (radius * (value / 100)) * Math.sin(angle);
        return { x, y };
    };

    const polygonPoints = stats.map((s, i) => {
        const { x, y } = getPoint(i, stats.length, s.value);
        return `${x},${y}`;
    }).join(' ');

    const watchTimeMinutes = (totalWatchTime || 0) / 60;

    return (
        <div className={`vibe-stats card-glow ${isHeaderVariant ? 'vibe-stats--header' : ''}`}>
            <div className="vibe-stats__main-layout">
                {/* Visual Side (Radar) */}
                <div className="vibe-stats__visual">
                    <div className="radar-container" onMouseLeave={() => setActiveDimension(null)}>
                        <svg viewBox={`0 0 ${size} ${size}`} className="radar-svg">
                            {[0.2, 0.4, 0.6, 0.8, 1.0].map((r, i) => (
                                <circle key={i} cx={center} cy={center} r={radius * r} className="radar-grid-circle" />
                            ))}

                            {stats.map((_, i) => {
                                const { x, y } = getPoint(i, stats.length, 100);
                                return <line key={i} x1={center} y1={center} x2={x} y2={y} className="radar-axis-line" />;
                            })}

                            <polygon
                                points={polygonPoints}
                                className={`radar-polygon ${activeDimension ? 'dim-hover' : ''}`}
                            />

                            {stats.map((s, i) => {
                                const { x, y } = getPoint(i, stats.length, 100);
                                return (
                                    <line
                                        key={`hover-${i}`}
                                        x1={center} y1={center} x2={x} y2={y}
                                        stroke="transparent" strokeWidth="40"
                                        onMouseEnter={() => setActiveDimension(s)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                );
                            })}
                        </svg>

                        {stats.map((s, i) => {
                            const { x, y } = getPoint(i, stats.length, 125);
                            const isActive = activeDimension?.key === s.key;
                            return (
                                <div
                                    key={s.key}
                                    className={`radar-label ${isActive ? 'active' : ''}`}
                                    style={{
                                        left: `${(x / size) * 100}%`,
                                        top: `${(y / size) * 100}%`,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                    onMouseEnter={() => setActiveDimension(s)}
                                >
                                    <span className="label-icon">{s.icon}</span>
                                    <span className="label-text">{s.label}</span>
                                    {isActive && <span className="label-pct">{s.percentage}%</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Identity Side (Info) */}
                <div className="vibe-stats__identity">
                    <div className="vibe-stats__identity-header">
                        <div className="badge">Cinematic DNA</div>
                        <h3>Taste Visualization</h3>
                    </div>

                    <div className="persona-card-v2">
                        <div className="persona-header">
                            <h4 className="persona-title">{persona.title}</h4>
                            <div className="persona-subtitle">Dominant Trait: {dominantTrait?.label}</div>
                        </div>
                        <p className="persona-desc">{persona.desc}</p>
                    </div>

                    <div className="identity-metrics">
                        <div className="metric">
                            <span className="metric-label">Completed</span>
                            <span className="metric-value">{analyzedMovies.length} <small>Titles</small></span>
                        </div>
                        <div className="metric">
                            <span className="metric-label">Immersion</span>
                            <span className="metric-value">{Math.round(watchTimeMinutes / 60)} <small>Hours</small></span>
                        </div>
                    </div>

                    <div className="top-contributors-mini">
                        <div className="contrib-header">Profile Influencers</div>
                        <div className="contrib-pills">
                            {analyzedMovies.slice(0, 4).map(m => (
                                <div key={m.id} className="mini-pill">{m.title}</div>
                            ))}
                            {analyzedMovies.length > 4 && <div className="mini-pill more">+{analyzedMovies.length - 4}</div>}
                        </div>
                    </div>

                    <button
                        className={`breakdown-toggle ${showFullBreakdown ? 'active' : ''}`}
                        onClick={() => setShowFullBreakdown(!showFullBreakdown)}
                    >
                        {showFullBreakdown ? 'Hide Full Analysis' : 'View Full Breakdown'}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showFullBreakdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Expandable Breakdown */}
            {showFullBreakdown && (
                <div className="dimension-details-compact fade-in">
                    <div className="dimension-grid-compact">
                        {stats.map(s => (
                            <div key={s.key} className="dim-card-compact">
                                <div className="dim-card-top">
                                    <span className="dim-icon">{s.icon}</span>
                                    <span className="dim-name">{s.label}</span>
                                    <span className="dim-pct">{s.percentage}%</span>
                                </div>
                                <div className="dim-bar-bg"><div className="dim-bar-fill" style={{ width: `${s.percentage}%` }}></div></div>
                                <div className="dim-titles-mini">
                                    {s.movies.slice(0, 2).map(m => m.title).join(', ')}
                                    {s.movies.length > 2 && '...'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VibeStats;
