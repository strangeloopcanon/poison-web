const path = require('path');

module.exports = {
  mode: 'production',
  entry: './packages/poison-core/src/lightweight.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'poison-lightweight.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'Poison',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  optimization: {
    minimize: true,
    usedExports: true,
    sideEffects: false,
  },
  performance: {
    hints: 'warning',
    maxEntrypointSize: 50000, // 50KB target
    maxAssetSize: 50000,
  },
}; 