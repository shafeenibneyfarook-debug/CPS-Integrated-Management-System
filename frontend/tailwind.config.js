/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cps: {
          navy: '#0f1a30',
          blue: '#2f6fe4',
          deepBlue: '#123b83',
          purple: '#211456',
          cyan: '#b7e4ee',
          ink: '#1c2433',
          panel: '#d9d9d9',
          canvas: '#f4f6f8',
          maroon: '#8e4747',
          charcoal: '#1f1f1f'
        },
      },
      boxShadow: {
        panel: '0 12px 30px rgba(15, 26, 48, 0.08)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
