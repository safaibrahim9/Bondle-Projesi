import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Force light theme for consistent colors across all browsers
        localStorage.setItem('app-theme', 'light');
        return 'light';
    });

    useEffect(() => {
        // Update data-theme attribute on document root
        document.documentElement.setAttribute('data-theme', theme);
        // Save to localStorage
        localStorage.setItem('app-theme', theme);
        
        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.getElementById('theme-color-meta');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'light' ? '#f5f3ff' : '#0f172a');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
