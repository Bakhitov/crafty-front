import type { Config } from 'tailwindcss'

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
        background: {
          DEFAULT: 'rgb(var(--background))',
          secondary: 'rgb(var(--background-secondary))',
          primary: 'rgb(var(--background-primary))'
        },
        foreground: 'rgb(var(--foreground))',
        border: 'rgb(var(--border))',
        accent: 'rgb(var(--accent))',
        muted: 'rgb(var(--muted))',
        destructive: 'rgb(var(--destructive))',
        positive: 'rgb(var(--positive))'
      },
      fontFamily: {
        geist: 'var(--font-geist-sans)',
        dmmono: 'var(--font-dm-mono)'
      },
      borderRadius: {
        xl: '10px'
      }
    }
  },
  plugins: []
} satisfies Config
