/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./App.tsx"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                serif: ['"Crimson Pro"', 'serif'],
                sans: ['"Inter"', 'sans-serif'],
            },
            colors: {
                bible: {
                    paper: '#fcfbf7',
                    gold: '#d4af37',
                    text: '#2c2c2c',
                    accent: '#8b4513',
                    soft: '#e8e6e1'
                }
            }
        }
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
