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
