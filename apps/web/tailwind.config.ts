import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        farmwise: {
          deep: '#0F3D26',
          leaf: '#2E7D32',
          lime: '#6DB33F',
          yellow: '#FFC72C',
          offwhite: '#F7F9F4',
          charcoal: '#1A2B20'
        }
      }
    }
  },
  plugins: []
} satisfies Config;
