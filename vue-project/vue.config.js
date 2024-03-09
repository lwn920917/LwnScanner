const { defineConfig } = require('@vue/cli-service');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: 'public/manifest.json', to: 'manifest.json' },
          { from: 'public/icons', to: 'icons' },
          { from: 'src/background.js', to: 'background.js' }, // 添加此模式
          { from: 'src/content-script.js', to: 'content-script.js' }, // 添加此模式
          { from: 'src/inject-popup.js', to: 'inject-popup.js' },
          { from: 'src/html2canvas.min.js', to: 'html2canvas.min.js' }
        ]
      })
    ],
    resolve: {
      fallback: {
        path: require.resolve('path-browserify')
      }
    }
  },
  chainWebpack: config => {
    config.output
      .filename('[name].js')
      .chunkFilename('[name].js');
  }
});