'use strict';

module.exports = function (config) {

  config.set({

    basePath: '',

    frameworks: ['mocha'],

    reporters: ['mocha'],

    files: [
      'tests-webpack.js'
    ],

    port: 9876,
    colors: true,
    autoWatch: true,
    singleRun: false,

    logLevel: config.LOG_INFO,

    browsers: ['jsdom'], //['PhantomJS'],

    preprocessors: {
      'tests-webpack.js': ['webpack', 'sourcemap']
    },

    webpack: {
      devtool: 'inline-source-map',
      cache: true,
      resolve: {
        extensions: ['', '.js', '.jsx']
      },
      module: {
        loaders: [
          {
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: /node_modules/
          }
        ]
      }
    },

    webpackServer: {
      noInfo: true
    }
  });
};
