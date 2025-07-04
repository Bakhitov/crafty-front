import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FAFAFA',
        primaryAccent: '#18181B',
        brand: 'gray',
        background: {
          DEFAULT: '#111113',
          secondary: '#27272A'
        },
        foreground: '#f5f5f5',
        secondary: '#f5f5f5',
        border: '#f5f5f5',
        accent: '#27272A',
        muted: '#A1A1AA',
        destructive: '#E53935',
        positive: '#22C55E'
      },
      fontFamily: {
        geist: 'var(--font-geist-sans)',
        dmmono: 'var(--font-dm-mono)'
      },
      borderRadius: {
        xl: '10px'
      },
      animation: {
        rainbow: 'rainbow var(--speed, 2s) infinite linear',
        'pulse-glow': 'pulse-glow var(--duration, 2s) ease-in-out infinite',
        meteor: 'meteor 5s linear infinite',
        marquee: 'marquee var(--duration) linear infinite',
        'marquee-vertical': 'marquee-vertical var(--duration) linear infinite'
      },
      keyframes: {
        rainbow: {
          '0%': { backgroundPosition: '0%' },
          '100%': { backgroundPosition: '200%' }
        },
        'pulse-glow': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '0.8'
          },
          '50%': {
            transform: 'scale(1.05)',
            opacity: '0.4'
          }
        },
        meteor: {
          '0%': {
            transform: 'rotate(var(--angle)) translateX(0)',
            opacity: '1'
          },
          '70%': {
            opacity: '1'
          },
          '100%': {
            transform: 'rotate(var(--angle)) translateX(-500px)',
            opacity: '0'
          }
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(-100% - var(--gap)))' }
        },
        'marquee-vertical': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(calc(-100% - var(--gap)))' }
        }
      }
    }
  },
  plugins: [tailwindcssAnimate]
} satisfies Config
