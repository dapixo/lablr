import purgecss from '@fullhuman/postcss-purgecss'

const config = {
  plugins: [
    "@tailwindcss/postcss",
    ...(process.env.NODE_ENV === 'production'
      ? [
          purgecss({
            content: [
              './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
              './src/components/**/*.{js,ts,jsx,tsx,mdx}',
              './src/app/**/*.{js,ts,jsx,tsx,mdx}',
            ],
            // Configuration pour PrimeReact
            safelist: {
              standard: [
                /^p-/,        // Toutes les classes PrimeReact
                /^pi-/,       // Toutes les icônes PrimeIcons
                /^animate-/,  // Animations Tailwind
                /^data-/,     // Attributs data
              ],
              deep: [
                /p-dialog/,
                /p-toast/,
                /p-inputotp/,
                /p-fileupload/,
                /p-dropdown/,
                /p-paginator/,
                /p-accordion/,
                /p-confirmdialog/,
                /p-progressbar/,
                /p-skeleton/,
              ],
            },
            defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
          }),
        ]
      : []),
  ],
};

export default config;
