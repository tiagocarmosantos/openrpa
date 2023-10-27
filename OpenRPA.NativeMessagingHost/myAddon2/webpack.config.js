const path = require('path');
const CopyPlugin = require('copy-webpack-plugin')

const outputDirectory = "./build";

module.exports = {
  mode: `none`,
  entry: {
    background: path.resolve('./src/background.js'),
    content: path.resolve('./src/content.js')
  },
  plugins: [
    new CopyPlugin({
        patterns: [{
            from: path.resolve('./public'),
            to: path.resolve(outputDirectory)
        }]
    }),
],
  output: {
    filename: '[name].js',
    path: path.resolve(outputDirectory),
  },
};