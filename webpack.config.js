const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

const dist = path.resolve(__dirname, 'dist');

const general = {
  mode: 'development',
  output: {
    path: dist,
    filename: '[name].js',
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  devtool: 'source-map',
  experiments: {
    syncWebAssembly: true,
    asyncWebAssembly: true,
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
};

const extension = {
  ...general,
  target: 'node',
  entry: {
    'extension-vscode': './src/extension.ts',
  },
  output: {
    ...general.output,
    libraryTarget: 'commonjs2',
  }
};

const webextension = {
  ...general,
  target: 'webworker',
  entry: {
    'extension-web': './src/extension.ts',
  },
  output: {
    ...general.output,
    libraryTarget: 'commonjs2',
  },
  resolve: {
    ...general.resolve,
    mainFields: ['browser', 'module', 'main'],
    extensions: ['.ts', '.js'],
    fallback: {
      fs: false,
      path: false
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser'
    })
  ],
};

const webview = {
  ...general,
  target: 'web',
  entry: {
    webview_nifti: './niivue/main.ts'
  },
  output: {
    ...general.output,
    filename: 'niivue/main.js',
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'niivue/index.html', to: 'niivue/index.html' },
      ],
    }),
  ],
};

module.exports = [extension, webextension, webview];