/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'healthy': '#10B981',
        'unhealthy': '#EF4444',
        'unknown': '#6B7280',
      }
    },
  },
  plugins: [],
}
