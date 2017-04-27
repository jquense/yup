'use strict';

module.exports = function (config) {

  config.set({

    basePath: '',

    frameworks: ['mocha', 'sinon-chai'],

    reporters: ['mocha'],

    files: [
      'tests-webpack.js'
    ],

    port: 9876,
    colors: true,
    autoWatch: true,
    singleRun: false,

    logLevel: config.LOG_INFO,

    browsers: ['Chrome'],

    preprocessors: {
      'tests-webpack.js': ['webpack', 'sourcemap']
    },

    webpack: {
      devtool: 'inline-source-map',
      cache: true,
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
