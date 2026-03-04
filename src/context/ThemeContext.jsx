import React, { createContext, useState, useEffect, useContext } from 'react';
import {
    Palette, Sun, Moon, Snowflake, Ghost, Box, Terminal,
    Coffee, Sparkles, Waves, Activity, Sunrise,
    Gamepad2, Cloud, Cpu
} from 'lucide-react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Default to 'default' or read from localStorage
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('vibeo-theme') || 'default';
    });

    // Default to 'none' or read from localStorage
    const [backgroundPattern, setBackgroundPattern] = useState(() => {
        return localStorage.getItem('vibeo-pattern') || 'none';
    });

    useEffect(() => {
        // Persist theme
        localStorage.setItem('vibeo-theme', theme);
        // Apply to body for CSS selectors
        document.body.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        // Persist pattern
        localStorage.setItem('vibeo-pattern', backgroundPattern);
        // Apply to body for CSS selectors
        document.body.setAttribute('data-pattern', backgroundPattern);
    }, [backgroundPattern]);

    const changeTheme = (id) => setTheme(id);
    const changeBackground = (id) => setBackgroundPattern(id);

    const resetTheme = () => {
        setTheme('default');
        setBackgroundPattern('none');
    };

    const value = {
        theme,
        changeTheme,
        resetTheme,
        backgroundPattern,
        changeBackground,
        availableThemes: [
            // Standard / Base Themes
            { id: 'default', name: 'Vibeo', desc: 'Vibeo Original', icon: 'Palette', category: 'Standard' },
            { id: 'light', name: 'Light', desc: 'Clean White', icon: 'Sun', category: 'Standard' },
            { id: 'oled', name: 'Dark OLED', desc: 'True Black', icon: 'Moon', category: 'Standard' },
            { id: 'nord', name: 'Nord', desc: 'Arctic Code', icon: 'Snowflake', category: 'Standard' },
            { id: 'dracula', name: 'Dracula', desc: 'Vampire Dark', icon: 'Ghost', category: 'Standard' },
            { id: 'slate', name: 'Slate', desc: 'Muted Blue', icon: 'Box', category: 'Standard' },
            { id: 'terminal', name: 'Terminal', desc: 'Retro Hacker', icon: 'Terminal', category: 'Standard' },

            // Legacy Vibeo Themes
            { id: 'coffee', name: 'Coffee', desc: 'Warm Brown', icon: 'Coffee', category: 'Legacy' },
            { id: 'aurora', name: 'Aurora', desc: 'Cyan Glow', icon: 'Sparkles', category: 'Legacy' },
            { id: 'abyss', name: 'Abyss', desc: 'Deep Ocean', icon: 'Waves', category: 'Legacy' },
            { id: 'cyberwire', name: 'Cyberwire', desc: 'Neon Pink', icon: 'Activity', category: 'Legacy' },
            { id: 'sunset', name: 'Sunset', desc: 'Warm Orange', icon: 'Sunrise', category: 'Legacy' },

            // Animated / Special Themes
            { id: 'chroma', name: 'Chroma', desc: 'RGB Gamer', icon: 'Gamepad2', category: 'Animated' },
            { id: 'nebula', name: 'Nebula', desc: 'Cosmic Field', icon: 'Cloud', category: 'Animated' },
            { id: 'matrix', name: 'Matrix', desc: 'Digital Rain', icon: 'Cpu', category: 'Animated' },
        ],
        availablePatterns: [
            { id: 'grid', name: 'Grid', desc: 'Cyberpunk' },
            { id: 'dots', name: 'Dots', desc: 'Minimal' },
            { id: 'cross', name: 'Cross', desc: 'Technical' },
            { id: 'waves', name: 'Waves', desc: 'Fluid' },
            { id: 'none', name: 'None', desc: 'Clean' }
        ]
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
