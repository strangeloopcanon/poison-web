const path = require('path');

module.exports = {
  mode: 'production',
  entry: './packages/poison-core/src/index.ts',
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
    filename: 'poison.js',
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
    maxEntrypointSize: 200000,
    maxAssetSize: 200000,
  },
  externals: {
    // Exclude Node.js specific modules from browser bundle
    fs: 'commonjs fs',
    path: 'commonjs path',
    yaml: 'commonjs yaml',
  },
};
