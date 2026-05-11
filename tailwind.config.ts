import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f4efe6',
        ink: '#1a1a1a',
        paper: '#fbf7ef',
        accent: '#ff4d2e',
      },
    },
  },
  plugins: [],
};

export default config;
