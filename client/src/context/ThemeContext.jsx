// import { createContext, useContext, useEffect, useState } from 'react';

// const ThemeContext = createContext(null);

// export function ThemeProvider({ children }) {
//     const [theme, setTheme] = useState(
//         () => localStorage.getItem('sbc-theme') || 'dark'
//     );

//     useEffect(() => {
//         document.documentElement.classList.toggle('dark', theme === 'dark');
//         localStorage.setItem('sbc-theme', theme);
//     }, [theme]);

//     const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

//     return (
//         <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
//             {children}
//         </ThemeContext.Provider>
//     );
// }

// export function useTheme() {
//     const ctx = useContext(ThemeContext);
//     if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
//     return ctx;
// }

// export default ThemeContext;












import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(
        () => localStorage.getItem('sbc-theme') || 'dark'
    );

    useEffect(() => {
        // CSS এ `:root.light` আছে — তাই light হলে `.light` class যোগ করো
        // (আগে ভুলে `.dark` toggle হতো, CSS এর সাথে মিলত না)
        document.documentElement.classList.toggle('light', theme === 'light');
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('sbc-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
}

export default ThemeContext;