import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Строгое управление темой через класс для next-themes
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FFB380', // Акцентный пастельно-нежно оранжевый
          dark: '#E69E6E',
          light: '#FFD4B8',
        },
        surface: {
          dark: '#121212', // Глубокий темный для фона (по умолчанию)
          light: '#F8F9FA',
          cardDark: '#1E1E1E',
          cardLight: '#FFFFFF',
        }
      },
      boxShadow: {
        // Брутализм: жесткие тени без размытия
        'brutal-dark': '4px 4px 0px 0px rgba(255, 179, 128, 0.5)', // Цветная тень для темной темы
        'brutal-light': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
        // Скевоморфизм: внутренний объем и вдавленность
        'skeuo-inner-dark': 'inset 2px 2px 4px rgba(255,255,255,0.05), inset -2px -2px 6px rgba(0,0,0,0.8)',
        'skeuo-inner-light': 'inset 2px 2px 4px rgba(255,255,255,0.8), inset -2px -2px 6px rgba(0,0,0,0.1)',
        // Комбинированный: объем внутри + жесткая тень снаружи
        'mix-dark': '4px 4px 0px 0px rgba(255, 179, 128, 0.3), inset 2px 2px 4px rgba(255,255,255,0.05)',
        'mix-light': '4px 4px 0px 0px rgba(0, 0, 0, 1), inset 2px 2px 4px rgba(255,255,255,0.8)',
      },
      borderRadius: {
        'brutal': '0.5rem', // Слегка скругленные углы, характерные для neo-brutalism
      }
    },
  },
  plugins: [],
}

export default config
