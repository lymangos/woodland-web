/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 1. 搬过来的颜色配置
      colors: {
        stone: {
          950: '#0c0a09',
          900: '#1c1917',
          800: '#292524',
          700: '#44403c',
          600: '#57534e',
          500: '#78716c',
          400: '#a8a29e',
          300: '#d6d3d1',
          200: '#e7e5e4',
          100: '#f5f5f4',
        }
      },
      // 2. 搬过来的字体配置
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      }
    },
  },
  plugins: [],
}