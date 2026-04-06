/**
 * Webpack 5 Configuration
 * Features: code splitting, tree shaking, gzip+brotli compression
 * Stack: React 18 + JavaScript + Tailwind CSS + shadcn/ui + lucide-react
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import CompressionPlugin from 'compression-webpack-plugin'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
// ForkTsCheckerWebpackPlugin removed — JS-only project (Rule #267)
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'
import zlib from 'zlib'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = process.env.NODE_ENV !== 'production'
const isAnalyze = process.env.ANALYZE === 'true'

// Inject og:url from brand.json (SITE_URL env override supported) — fixes #19203
const brandPath = path.resolve(__dirname, '../brand.json')
let brandSiteUrl = ''
try {
  const brand = JSON.parse(readFileSync(brandPath, 'utf8'))
  brandSiteUrl = brand.site_url || ''
} catch (_) {}
const siteUrl = process.env.SITE_URL || brandSiteUrl || ''

export default {
  // ─── Mode & Entry ───────────────────────────────────────────────────────────
  mode: isDev ? 'development' : 'production',

  entry: {
    main: './src/main.jsx',
  },

  // ─── Output ─────────────────────────────────────────────────────────────────
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isDev
      ? 'js/[name].js'
      : 'js/[name].[contenthash:8].js',
    chunkFilename: isDev
      ? 'js/[name].chunk.js'
      : 'js/[name].[contenthash:8].chunk.js',
    assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
    publicPath: '/',
    clean: true,
  },

  // ─── Resolve ────────────────────────────────────────────────────────────────
  resolve: {
    extensions: ['.jsx', '.js', '.json'],
    alias: {
      // Root alias: @/ → src/
      '@': path.resolve(__dirname, 'src'),
      // Design system components: @system/ → src/app/components/@system/
      '@system': path.resolve(__dirname, 'src/app/components/@system'),
      // Product-specific custom components: @custom/ → src/app/components/@custom/
      '@custom': path.resolve(__dirname, 'src/app/components/@custom'),
    },
  },

  // ─── Tree Shaking ───────────────────────────────────────────────────────────
  // Tree shaking is enabled by default in production mode.
  // sideEffects: false in package.json instructs webpack to prune unused exports.
  // usedExports + concatenateModules (scope hoisting) maximize dead-code removal.
  optimization: {
    // Mark used exports so terser can drop dead code
    usedExports: true,

    // Scope hoisting: concatenate modules into fewer closures
    concatenateModules: !isDev,

    // ─── Code Splitting ───────────────────────────────────────────────────
    splitChunks: {
      chunks: 'all',
      // Minimum size (bytes) before a chunk is split out
      minSize: 20_000,
      // Max size hint — webpack will try to split chunks larger than this
      maxSize: 244_000,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      cacheGroups: {
        // React runtime — changes rarely, cache long-term
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom|scheduler)[\\/]/,
          name: 'vendor-react',
          chunks: 'all',
          priority: 40,
        },

        // Radix UI primitives (used by shadcn)
        radix: {
          test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
          name: 'vendor-radix',
          chunks: 'all',
          priority: 30,
        },

        // lucide-react icons — large library, isolate for better caching
        lucide: {
          test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
          name: 'vendor-lucide',
          chunks: 'all',
          priority: 30,
        },

        // All other node_modules
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 20,
        },

        // Shared modules used in multiple async chunks
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'async',
          priority: 10,
          reuseExistingChunk: true,
        },
      },
    },

    // Keep runtime chunk separate so vendor hashes don't change on app update
    runtimeChunk: 'single',

    minimizer: [
      // ─── JS Minification ──────────────────────────────────────────────
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          parse: { ecma: 2020 },
          compress: {
            ecma: 5,
            comparisons: false,
            inline: 2,
            // Remove console.* in production
            drop_console: !isDev,
            drop_debugger: !isDev,
          },
          mangle: { safari10: true },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
      }),

      // ─── CSS Minification ─────────────────────────────────────────────
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: ['default', { discardComments: { removeAll: true } }],
        },
      }),
    ],
  },

  // ─── Module Rules ────────────────────────────────────────────────────────────
  module: {
    rules: [
      // Disable fullySpecified for .js/.mjs files so imports without extensions resolve
      {
        test: /\.m?js$/,
        resolve: { fullySpecified: false },
      },
      // JSX / JS
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              presets: [
                ['@babel/preset-env', { targets: 'defaults', modules: false }],
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript',
              ],
              plugins: [
                // Fast Refresh in dev
                isDev && 'react-refresh/babel',
              ].filter(Boolean),
            },
          },
        ],
      },

      // CSS / PostCSS (Tailwind)
      {
        test: /\.css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { importLoaders: 1 },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                config: path.resolve(__dirname, 'postcss.config.mjs'),
              },
            },
          },
        ],
      },

      // Images / fonts / SVGs as asset modules (Webpack 5 built-in)
      {
        test: /\.(png|jpg|jpeg|gif|webp|avif|svg)$/i,
        type: 'asset',
        parser: {
          // Inline assets < 8 KB as data URIs; larger → separate file
          dataUrlCondition: { maxSize: 8_192 },
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },

  // ─── Plugins ─────────────────────────────────────────────────────────────────
  plugins: [
    // HTML entry point
    new HtmlWebpackPlugin({
      template: './index.html',
      inject: true,
      templateParameters: { siteUrl },
      // In production, minify the HTML
      minify: !isDev && {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),

    // Extract CSS into separate files (production only)
    !isDev &&
      new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash:8].css',
        chunkFilename: 'css/[name].[contenthash:8].chunk.css',
      }),

    // TypeScript type checking removed — JS-only project (Rule #267)

    // Environment variables available in browser bundle
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(
        isDev ? 'development' : 'production'
      ),
    }),

    // ─── Compression ──────────────────────────────────────────────────────
    // Gzip — broad browser support
    !isDev &&
      new CompressionPlugin({
        filename: '[path][base].gz',
        algorithm: 'gzip',
        test: /\.(js|css|html|svg|json|ico|map)$/,
        threshold: 10_240, // Only compress files > 10 KB
        minRatio: 0.8,
        deleteOriginalAssets: false,
      }),

    // Brotli — better compression ratio for modern browsers
    !isDev &&
      new CompressionPlugin({
        filename: '[path][base].br',
        algorithm: 'brotliCompress',
        test: /\.(js|css|html|svg|json|ico|map)$/,
        threshold: 10_240,
        minRatio: 0.8,
        deleteOriginalAssets: false,
        compressionOptions: {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
          },
        },
      }),

    // Fast Refresh (dev only)
    isDev && new ReactRefreshWebpackPlugin({ overlay: false }),

    // Bundle visualizer — run with ANALYZE=true npm run build
    isAnalyze &&
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: '../bundle-report.html',
        openAnalyzer: true,
      }),
  ].filter(Boolean),

  // ─── Dev Server ──────────────────────────────────────────────────────────────
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 3000,
    hot: true,
    open: false,
    compress: true,
    historyApiFallback: true, // SPA fallback for react-router
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    ],
  },

  // ─── Source Maps ─────────────────────────────────────────────────────────────
  devtool: isDev ? 'eval-source-map' : 'source-map',

  // ─── Performance Hints ───────────────────────────────────────────────────────
  performance: {
    hints: isDev ? false : 'warning',
    maxEntrypointSize: 512_000,
    maxAssetSize: 512_000,
  },

  // ─── Stats ───────────────────────────────────────────────────────────────────
  stats: {
    assets: true,
    chunks: false,
    modules: false,
    entrypoints: false,
    colors: true,
  },
}
