/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        alro: ['Alro', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#e5ba4a',
          hover:   '#d4a93a',
        },
        secondary: '#bababa',
      },
    },
  },
  plugins: [],
};
