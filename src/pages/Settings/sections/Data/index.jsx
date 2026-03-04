import React from 'react';
import { Database, Download, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLayout } from '@/context/LayoutContext';
import './styles.css';

const DataSection = () => {
    const { theme, backgroundPattern, resetTheme } = useTheme();
    const { cardSize, glassLevel, showMetadata, resetLayout } = useLayout();

    const handleExport = () => {
        const settings = {
            appearance: { theme, backgroundPattern },
            layout: { cardSize, glassLevel, showMetadata },
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };

        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vibeo-settings-${new Date().toLocaleDateString()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all settings to default? This will revert your theme and layout preferences.')) {
            resetTheme();
            resetLayout();
        }
    };

    return (
        <div className="settings-section animate-fade-in data-section">
            <h2><span className="icon"><Database size={20} /></span> Data & Import</h2>

            <div className="data-grid">
                {/* Backup / Export */}
                <div className="data-card">
                    <div className="data-card-info">
                        <h3><Download size={18} /> Export Settings</h3>
                        <p>Download your current preferences as a JSON file.</p>
                    </div>
                    <button className="btn-data btn-export" onClick={handleExport}>
                        <Download size={16} /> Export
                    </button>
                </div>

                {/* Import Placeholder */}
                <div className="data-card opacity-60">
                    <div className="data-card-info">
                        <h3><ShieldCheck size={18} /> Import Settings</h3>
                        <p>Restore settings from a backup file (Coming Soon).</p>
                    </div>
                    <button className="btn-data bg-surface3 cursor-not-allowed" disabled>
                        Locked
                    </button>
                </div>

                {/* Reset Section - Danger Zone */}
                <div className="data-card danger-zone">
                    <div className="data-card-info">
                        <h3 className="text-red-500"><AlertTriangle size={18} /> Factory Reset</h3>
                        <p>Reset all theme and layout settings to their original state.</p>
                    </div>
                    <button className="btn-data btn-reset" onClick={handleReset}>
                        <RefreshCw size={16} /> Reset All
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataSection;
