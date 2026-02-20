import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sf-pro': ['var(--font-sf-pro)', 'system-ui', 'sans-serif'],
        'abhaya': ['var(--font-abhaya)', 'serif'],
        'lora': ['var(--font-lora)', 'serif'],
        'jakarta': ['var(--font-jakarta)', 'sans-serif'],
        'inter': ['var(--font-inter)', 'sans-serif'],
        'outfit': ['var(--font-outfit)', 'sans-serif'],
        'geist': ['var(--font-geist)', 'system-ui', 'sans-serif'],
        'manrope': ['var(--font-manrope)', 'sans-serif'],
        'roboto': ['var(--font-roboto)', 'sans-serif'],
        'poppins': ['var(--font-poppins)', 'sans-serif'],
        'arimo': ['var(--font-arimo)', 'sans-serif'],
        'tinos': ['var(--font-tinos)', 'serif'],
        'fahkwang': ['var(--font-fahkwang)', 'sans-serif'],
      },
      fontSize: {
        // Responsive fluid typography using clamp()
        'hero-heading': 'clamp(2rem, 3.333vw, 4rem)', // 32px to 64px
        'nav-item': 'clamp(1.5rem, 2.083vw, 2.5rem)', // 24px to 40px
        'cta-button': 'clamp(1.5rem, 2.083vw, 2.5rem)', // 24px to 40px
      },
      colors: {
        'cta-yellow': '#FFD170',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(90deg, #FFFFFF 0%, #999999 100%)',
      },
      boxShadow: {
        'hero-text': '0px 4px 9.7px 0px rgba(255, 255, 255, 0.05) inset',
        'cta-button': '0px 4px 17.1px 0px rgba(255, 255, 255, 0.06) inset',
      },
    },
  },
  plugins: [],
}
export default config
