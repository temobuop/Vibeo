import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, X } from 'lucide-react';
import './styles.css';

/**
 * Global Error Feedback Component
 * Listen for 'app:error' custom events to show premium toasts.
 */
const ErrorToast = () => {
    const [error, setError] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    const handleError = useCallback((event) => {
        const { message, type = 'error' } = event.detail || {};
        setError({ message, type });
        setIsVisible(true);

        // Auto-hide after 5 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        window.addEventListener('app:error', handleError);
        return () => window.removeEventListener('app:error', handleError);
    }, [handleError]);

    if (!isVisible || !error) return null;

    return (
        <div className={`error-toast-container ${isVisible ? 'toast-show' : 'toast-hide'}`}>
            <div className="error-toast-content">
                <div className="error-toast-icon">
                    <AlertCircle size={20} />
                </div>
                <div className="error-toast-text">
                    <p>{error.message || 'Something went wrong. Please try again.'}</p>
                </div>
                <button className="error-toast-close" onClick={() => setIsVisible(false)}>
                    <X size={16} />
                </button>
            </div>
            <div className="error-toast-progress"></div>
        </div>
    );
};

export default ErrorToast;

/**
 * Utility to trigger the error toast from anywhere in the app
 */
export const triggerError = (message, type = 'error') => {
    const event = new CustomEvent('app:error', {
        detail: { message, type }
    });
    window.dispatchEvent(event);
};
