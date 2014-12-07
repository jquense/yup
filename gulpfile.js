'use strict';
var gulp = require('gulp')
  , plumber = require('gulp-plumber')
  , mocha = require('gulp-mocha');
var es = require('event-stream');
var Buffer = require('buffer').Buffer;
var jstransform = require('jstransform')

gulp.task('test-runner', function(){

	gulp.watch(['./lib/**/*.js'], ['jstransform'])

  gulp.watch('./test/**/*.js', function(e){

    gulp.src(e.path)
      .pipe(plumber())
      .pipe(transform())
      .pipe(mocha({ reporter: 'spec' }))
  })
})

gulp.task('watch', function(){
  gulp.watch(['./lib/**/*.js', './test/**/*.js'], ['jstransform'])
})

gulp.task('mocha', function () {
    return gulp.src('test.js', { read: false })
        .pipe(mocha({ reporter: 'spec' }));
});


gulp.task('jstransform', function() {
  gulp.src('./lib/**/*.js')
    .pipe(plumber())
    .pipe(transform())
    .pipe(gulp.dest('./dist/'))
})


var defaultVisitors = [
    'jstransform/visitors/es6-arrow-function-visitors',
    'jstransform/visitors/es6-class-visitors',
    'jstransform/visitors/es6-destructuring-visitors',
    'jstransform/visitors/es6-object-concise-method-visitors',
    'jstransform/visitors/es6-object-short-notation-visitors',
    'jstransform/visitors/es6-rest-param-visitors',
    'jstransform/visitors/es6-template-visitors',
    'jstransform/visitors/es7-spread-property-visitors'  
];

function transform(opt) {
  function modifyFile(file){
    if (file.isNull())
      return this.emit('data', file); // pass along
    
    if (file.isStream())
      return this.emit('error', new Error("gulp-jstransfrom: Streaming not supported"));
    
    // Influenced by https://github.com/stoyan/etc/master/es6r/es6r.js
    var str = file.contents.toString('utf8');
    var visitors = [];

    defaultVisitors.forEach(function(visitor) {
      visitors = visitors.concat(require(visitor).visitorList);
    });
   
    var converted = jstransform.transform(visitors, str);
    file.contents = new Buffer(converted.code);
    this.emit('data', file);
  }

  return es.through(modifyFile);
}