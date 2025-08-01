import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,

  // Экспериментальные функции для улучшения производительности
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'react-icons',
      'lucide-react',
      'framer-motion'
    ],
    // Оптимизация CSS
    optimizeCss: true,
    // Турбо режим для сборки
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      }
    }
  },

  // Сжатие и оптимизация
  compress: true,

  // Оптимизация изображений
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7 // 7 дней
  },

  // Webpack оптимизации
  webpack: (config, { dev, isServer }) => {
    // Оптимизации только для production
    if (!dev) {
      // Анализ bundle size в development
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: isServer
              ? '../analyze/server.html'
              : './analyze/client.html'
          })
        )
      }

      // Оптимизация разделения кода
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor библиотеки
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10
            },
            // UI компоненты
            ui: {
              test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 20
            },
            // Playground компоненты
            playground: {
              test: /[\\/]src[\\/]components[\\/]playground[\\/]/,
              name: 'playground',
              chunks: 'all',
              priority: 15
            },
            // React и связанные библиотеки
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 30
            },
            // Supabase
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase',
              chunks: 'all',
              priority: 25
            },
            // Иконки
            icons: {
              test: /[\\/]node_modules[\\/](react-icons|lucide-react|@radix-ui\/react-icons)[\\/]/,
              name: 'icons',
              chunks: 'all',
              priority: 20
            }
          }
        }
      }
    }

    // Алиасы для оптимизации импортов
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src')
    }

    return config
  },

  // Заголовки для кеширования
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300' // 5 минут
          }
        ]
      }
    ]
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*'
      }
    ]
  }
}

export default nextConfig
