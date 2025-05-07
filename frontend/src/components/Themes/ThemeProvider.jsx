// ThemeProvider.jsx - Add this component to your project
import { createContext, useState, useEffect, useContext } from 'react';

// Create a context for the theme
export const ThemeContext = createContext();

// Create the provider component
export const ThemeProvider = ({ children }) => {
  // List of available themes
  const themes = [
    'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 
    'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden', 
    'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black', 
    'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade', 
    'night', 'coffee', 'winter'
  ];
  
  // Default theme - Emerald is recommended for medical applications
  const defaultTheme = 'emerald';
  
  // State to hold the current theme
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Try to get theme from localStorage or use default
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app-theme') || defaultTheme;
    }
    return defaultTheme;
  });

  // Effect to apply theme when it changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem('app-theme', currentTheme);
    }
  }, [currentTheme]);

  // Toggle between light and dark
  const toggleLightDark = () => {
    setCurrentTheme(current => current === 'light' ? 'dark' : 'light');
  };
  
  // Set a random theme
  const setRandomTheme = () => {
    const randomIndex = Math.floor(Math.random() * themes.length);
    setCurrentTheme(themes[randomIndex]);
  };

  // Value to be provided by the context
  const value = {
    themes,
    currentTheme,
    setTheme: setCurrentTheme,
    toggleLightDark,
    setRandomTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export recommended themes for medical applications
export const recommendedMedicalThemes = ['emerald', 'corporate', 'aqua', 'light', 'winter', 'lofi'];