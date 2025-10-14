const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  // Enable watch mode optimizations
  watchOptions: {
    aggregateTimeout: 200,
    ignored: /node_modules/,
    poll: false, // Use native file watching for better performance
  },

  // Performance optimizations for development
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },

  // Better error output for debugging
  stats: {
    errorDetails: true,
    warnings: true,
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'static'),
          to: path.resolve(__dirname, 'jupyterlab_niivue/labextension/static'),
        },
      ],
    }),
  ],

  resolve: {
    fallback: {
      fs: false,
      path: false,
      os: false,
    },
    // Cache module resolutions for faster rebuilds
    cache: true,
  },

  // Enable persistent caching for faster rebuilds
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
  },
}
