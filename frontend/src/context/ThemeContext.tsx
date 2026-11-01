import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'cinema' | 'obsidian' | 'emerald';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'cinema',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('cineverse_theme');
    return (saved as ThemeMode) || 'cinema';
  });

  useEffect(() => {
    localStorage.setItem('cineverse_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === 'cinema') return 'obsidian';
      if (prev === 'obsidian') return 'emerald';
      return 'cinema';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
