/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0A0A0A',
          dark: '#000000',
          light: '#1a1a1a',
          tint: '#f0f0f0',
        },
        secondary: {
          DEFAULT: '#C0C0C0',
          dark: '#909090',
          light: '#E8E8E8',
        },
        accent: {
          DEFAULT: '#C8A96E',
          dark: '#A8883E',
        },
      },
      fontFamily: {
        body: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Playfair Display', 'Georgia', 'serif'],
      },
      maxWidth: {
        content: '1240px',
        text: '720px',
      },
    },
  },
  plugins: [],
}
