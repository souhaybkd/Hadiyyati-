/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-bricolage)', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Design system colors
        'design-primary': '#FF007F',
        'design-secondary': '#F9A826',
        'design-accent': '#FFD1F4',
        'design-dark': '#18181B',
        'design-light': '#F9FAFB',
        'design-gray': {
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
        },
        'design-text': {
          heading: '#111827',
          body: '#374151',
          muted: '#6B7280',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'design-card': '1rem',
        'design-button': '0.5rem',
        'design-image': '1.5rem',
      },
      boxShadow: {
        'design-light': '0 4px 12px rgba(0, 0, 0, 0.04)',
        'design-card': '0 10px 30px rgba(0, 0, 0, 0.05)',
        'design-card-hover': '0 10px 40px rgba(0, 0, 0, 0.1)',
        'design-heavy': '0 15px 30px rgba(0, 0, 0, 0.1)',
      },
      fontSize: {
        'design-h1': ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
        'design-h2': ['2.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        'design-h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'design-body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'design-small': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      spacing: {
        'design-section': '6rem',
        'design-grid': '2rem',
        'design-card': '2rem',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      transitionProperty: {
        'design': 'all',
      },
      transitionDuration: {
        'design': '300ms',
      },
      transitionTimingFunction: {
        'design': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 