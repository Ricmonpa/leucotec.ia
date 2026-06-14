/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // Colorimetría oficial Grupo Leucotec (extraída del logo)
          primary: '#dc052b', // rojo institucional (espiral)
          'primary-dark': '#9e0420', // rojo profundo para degradados
          secondary: '#73797d', // gris corporativo (texto del logo)
          dark: '#4a4f52', // gris oscuro para títulos
          accent: '#10b981', // verde para ahorro/positivo
          danger: '#dc052b', // rojo = pérdida/riesgo (mismo que marca)
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
