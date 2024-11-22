import path from 'path';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

export default {
  entry: './meow.js',  
  output: {
    path: path.resolve('dist'),  
    filename: 'meow-analyzer.js',  
  },
  mode: 'production',  
  target: 'node',  
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',  
      },
    ],
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',  
      reportFilename: 'bundle-report.html',  
      openAnalyzer: true,
      theme: 'dark',
    }),
  ],
  resolve: {
    extensions: ['.js', '.mjs'],  
  },
};
