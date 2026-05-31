import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-montserrat)', 'Montserrat', 'sans-serif'],
        montserrat: ['var(--font-montserrat)', 'Montserrat', 'sans-serif'],
      },
      colors: {
        // Medical
        'med-primary': '#FFD700',
        'med-dark': '#1a0040',
        'med-accent': '#6a0dad',
        // Engineering
        'eng-primary': '#0a1628',
        'eng-accent': '#00C8B4',
        'eng-secondary': '#00A896',
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },
      boxShadow: {
        'card': '0 4px 20px rgba(26,0,64,0.08)',
        'card-hover': '0 12px 40px rgba(26,0,64,0.15)',
        'lift': '0 20px 60px rgba(26,0,64,0.15)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
