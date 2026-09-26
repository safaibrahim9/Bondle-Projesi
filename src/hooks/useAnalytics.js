import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

let globalPageOverride = null;

export const useAnalytics = (isTracker = false) => {
    const location = useLocation();
    const startTimeRef = useRef(Date.now());
    const currentPageRef = useRef(location.pathname);

    useEffect(() => {
        if (!isTracker) return;

        // Function to send log to backend
        const sendLog = async (page, startTime) => {
            const token = localStorage.getItem('token');
            if (!token || !startTime) return;

            let duration = Math.round((Date.now() - startTime) / 1000); // in seconds
            
            // Cap duration to 2 hours (7200 seconds) in case tab is left open and active
            if (duration > 7200) {
                duration = 7200;
            }

            // Only log if spent more than 2 seconds (avoid quick transitions/scrolls)
            if (duration >= 2) {
                try {
                    await api.logUserActivity(page, duration);
                } catch (err) {
                    // Fail silently for analytics
                    console.warn('Analytics log failed:', err);
                }
            }
        };

        // When location changes:
        // 1. Send log for the previous page
        // 2. Update current page and start time
        const previousPage = globalPageOverride || currentPageRef.current;
        const previousStartTime = startTimeRef.current;

        currentPageRef.current = location.pathname;
        startTimeRef.current = Date.now();
        globalPageOverride = null;

        // Send log for the page the user just left
        sendLog(previousPage, previousStartTime);

        // Also handle window close / refresh / backgrounding
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                if (startTimeRef.current) {
                    sendLog(globalPageOverride || currentPageRef.current, startTimeRef.current);
                }
                // Stop counting while hidden
                startTimeRef.current = null;
            } else if (document.visibilityState === 'visible') {
                // Start counting again when visible
                startTimeRef.current = Date.now();
            }
        };
        
        const beforeUnloadHandler = () => {
            if (startTimeRef.current) {
                sendLog(globalPageOverride || currentPageRef.current, startTimeRef.current);
            }
        };

        window.addEventListener('beforeunload', beforeUnloadHandler);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [location.pathname, isTracker]);

    const logEvent = async (name, type = 'click', metadata = {}) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            await api.logUserEvent(type, name, metadata);
        } catch (err) {
            console.warn('Event log failed:', err);
        }
    };

    const setPageOverride = (name) => {
        globalPageOverride = name;
    };

    return { logEvent, setPageOverride };
};
