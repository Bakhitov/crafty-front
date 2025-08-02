/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: [
          'default',
          {
            discardComments: {
              removeAll: true
            },
            // Отключаем опасные оптимизации которые могут ломать CSS
            normalizeWhitespace: false,
            reduceIdents: false,
            calc: false,
            discardUnused: false,
            mergeIdents: false,
            convertValues: false,
            // Не трогаем URL и специальные функции
            normalizeUrl: false,
            discardEmpty: false
          }
        ]
      }
    })
  }
}

export default config
