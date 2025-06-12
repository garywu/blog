/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./node_modules/@radix-ui/themes/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      borderRadius: {
        '1': 'var(--radius-1)',
        '2': 'var(--radius-2)',
        '3': 'var(--radius-3)',
        '4': 'var(--radius-4)',
        '5': 'var(--radius-5)',
        '6': 'var(--radius-6)',
      },
    },
  },
  plugins: [],
} 