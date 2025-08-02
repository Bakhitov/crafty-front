import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  devIndicators: false,

  // Экспериментальные функции для улучшения производительности
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'react-icons',
      'lucide-react'
    ]
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
    // Исправление ошибки "self is not defined" для серверной сборки
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false
      }
    }

    // Оптимизации только для production
    if (!dev) {
      // Анализ bundle size в development
      if (process.env.ANALYZE === 'true') {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
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

      // Более консервативная оптимизация разделения кода
      if (!isServer) {
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: 'async',
            cacheGroups: {
              // Vendor библиотеки
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: 10,
                enforce: true
              },
              // React и связанные библиотеки
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                name: 'react',
                chunks: 'all',
                priority: 30,
                enforce: true
              }
            }
          }
        }
      }
    }

    // Алиасы для оптимизации импортов
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src')
    }

    return config
  },

  // Заголовки для кеширования и CORS
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
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS, HEAD'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-Forwarded-For'
          },
          {
            key: 'Access-Control-Expose-Headers',
            value: 'Content-Length, X-JSON'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=60' // 1 минута для API
          }
        ]
      }
    ]
  }
}

export default nextConfig
