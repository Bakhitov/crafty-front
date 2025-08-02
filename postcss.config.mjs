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
            normalizeWhitespace: false,
            // Предотвращаем минификацию CSS переменных
            reduceIdents: false,
            // Не минифицируем calc() выражения
            calc: false,
            // Сохраняем важные свойства
            discardUnused: false
          }
        ]
      }
    })
  }
}

export default config
