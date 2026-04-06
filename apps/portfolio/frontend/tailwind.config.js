const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
    ...createGlobPatternsForDependencies(__dirname)
  ],
  theme: {
    extend: {
      screens: {
        mobile: { max: '767px' },
        tablet: '768px',
        desktop: '1024px',
        wide: '1280px'
      },
      colors: {
        background: 'hsl(230 65% 7%)',
        foreground: 'hsl(225 20% 92%)',
        primary: {
          DEFAULT: 'hsl(38 86% 56%)',
          foreground: 'hsl(230 65% 7%)'
        },
        secondary: {
          DEFAULT: 'hsl(225 55% 16%)',
          foreground: 'hsl(225 20% 92%)'
        },
        muted: {
          DEFAULT: 'hsl(225 40% 14%)',
          foreground: 'hsl(225 30% 65%)'
        },
        accent: {
          DEFAULT: 'hsl(225 55% 16%)',
          foreground: 'hsl(225 20% 92%)'
        },
        border: 'hsl(225 30% 20%)',
        card: {
          DEFAULT: 'hsl(225 55% 12%)',
          foreground: 'hsl(225 20% 92%)'
        },
        destructive: {
          DEFAULT: 'hsl(0 62.8% 30.6%)',
          foreground: 'hsl(225 20% 92%)'
        },
        ring: 'hsl(225 30% 65%)',
        input: 'hsl(225 30% 20%)',
        night: {
          sky: '#0a0e27',
          card: '#0f1b3d',
          text: '#e8eaf0',
          'text-soft': '#c0c8e0',
          'text-muted': '#8a9cc5',
          gold: '#f0a830',
          'gold-deep': '#e8963a',
          purple: '#667eea',
          'purple-deep': '#764ba2'
        }
      },
      borderRadius: {
        lg: '0.5rem',
        md: 'calc(0.5rem - 2px)',
        sm: 'calc(0.5rem - 4px)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))'
      },
      animation: {
        'slide-in-up': 'slideInUp 0.8s ease-out',
        'pulse-slow': 'pulse 2s infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        float: 'float 30s ease-in-out infinite',
        'expand-width': 'expandWidth 1s ease-out 0.5s forwards',
        twinkle: 'twinkle 4s ease-in-out infinite'
      },
      keyframes: {
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) rotate(120deg)' },
          '66%': { transform: 'translateY(10px) rotate(240deg)' }
        },
        expandWidth: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' }
        },
        twinkle: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' }
        }
      }
    }
  },
  plugins: []
};
