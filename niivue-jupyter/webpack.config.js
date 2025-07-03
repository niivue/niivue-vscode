const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'static'),
          to: path.resolve(__dirname, 'jupyterlab_niivue/labextension/static')
        }
      ]
    })
  ],
  resolve: {
    fallback: {
      "fs": false,
      "path": false,
      "os": false
    }
  }
};