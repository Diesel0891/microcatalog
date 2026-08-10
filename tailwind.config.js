import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d',
          950: '#1a1a1a',
        },
        copper: {
          50: '#fdf8f6',
          100: '#faede8',
          200: '#f5d8cd',
          300: '#edbba9',
          400: '#e0957a',
          500: '#d47654',
          600: '#c65f3e',
          700: '#a54c32',
          800: '#8a402d',
          900: '#723929',
          950: '#3d1b12',
        },
        sage: {
          50: '#f4f7f4',
          100: '#e3ebe3',
          200: '#c7d9c7',
          300: '#9ebf9e',
          400: '#729f72',
          500: '#528252',
          600: '#3f663f',
          700: '#345234',
          800: '#2b412b',
          900: '#243624',
          950: '#111e11',
        },
      },
            fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'elevation-1': '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.02)',
        'elevation-2': '0 4px 6px -1px rgb(0 0 0 / 0.04), 0 2px 4px -2px rgb(0 0 0 / 0.02)',
        'elevation-3': '0 10px 15px -3px rgb(0 0 0 / 0.04), 0 4px 6px -4px rgb(0 0 0 / 0.02)',
        'elevation-4': '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.03)',
      },
            transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-subtle': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      letterSpacing: {
        'tight': '-0.025em',
        'normal': '0',
        'wide': '0.025em',
        'wider': '0.05em',
        'display': '-0.02em',
      },
      lineHeight: {
        'tight': '1.2',
        'snug': '1.35',
        'normal': '1.5',
        'relaxed': '1.65',
      },
    },
  },


  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        infini: {
          'primary': '#c65f3e',
          'primary-content': '#ffffff',
          'secondary': '#1a1a1a',
          'secondary-content': '#ffffff',
          'accent': '#2563eb',
          'accent-content': '#ffffff',
          'neutral': '#f6f6f6',
          'neutral-content': '#1a1a1a',
          'base-100': '#fafaf9',
          'base-200': '#f5f5f4',
          'base-300': '#e7e5e4',
          'base-content': '#1c1917',
          'info': '#2563eb',
          'success': '#528252',
          'warning': '#d47654',
          'error': '#b91c1c',
        },
      },
    ],
    darkTheme: false,
    base: true,
    styled: true,
    utils: true,
    prefix: '',
    logs: false,
  },
}
