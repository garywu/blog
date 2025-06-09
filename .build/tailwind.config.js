/** @type {import('tailwindcss').Config} */
export default {
  content: ['./dist/**/*.html'],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            code: {
              backgroundColor: '#f3f4f6',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
      },
    },
  },
  plugins: [],
}; 