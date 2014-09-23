var gulp = require('gulp')
  , plumber = require('gulp-plumber')
  , mocha = require('gulp-mocha');


gulp.task('test-runner', function(){
  gulp.watch('./test/**/*.js', function(e){
    gulp.src(e.path)
      .pipe(plumber())
      .pipe(mocha({ reporter: 'spec' }))
  })
})

gulp.task('mocha', function () {
    return gulp.src('test.js', { read: false })
        .pipe(mocha({ reporter: 'spec' }));
});