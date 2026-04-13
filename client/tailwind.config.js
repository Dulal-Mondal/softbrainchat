/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    darkMode: 'class', // class-based dark mode — ThemeContext দিয়ে control
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#EFF5FF',
                    100: '#DBEAFE',
                    400: '#4F8EF7',
                    500: '#3B7AE8',
                    600: '#2563EB',
                    900: '#1E3A8A',
                },
            },
            fontFamily: {
                sans: ['DM Sans', 'sans-serif'],
                display: ['Syne', 'sans-serif'],
                mono: ['DM Mono', 'monospace'],
            },
        },
    },
    plugins: [],
};