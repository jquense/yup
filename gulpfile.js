'use strict';
var gulp = require('gulp')
  , del = require('del')
  , plumber = require('gulp-plumber')
  , mocha = require('gulp-mocha')
  , rename = require('gulp-rename')
  , babelTransform = require('gulp-babel-helpers')


gulp.task('clean', function(cb){
  del('./lib', cb);
})

gulp.task('compile', [ 'clean' ], function(){

  return gulp.src('./src/**/*.js')
      .pipe(plumber())
      .pipe(babelTransform('./util/babelHelpers.js'))
      .pipe(rename({ extname: '.js' }))
      .pipe(gulp.dest('./lib'));
})


gulp.task('publish', ['compile'], require('jq-release'))