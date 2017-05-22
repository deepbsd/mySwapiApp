var gulp = require('gulp'),
    livereload = require('gulp-livereload'),
    nodemon = require('gulp-nodemon'),
    sass = require('gulp-sass');

gulp.task('js', function() {
  return gulp.src([
    'src/js/*.js'
  ])
  .pipe(livereload());
});

gulp.task('html', function() {
  return gulp.src([
    'public/index.html'
  ])
  .pipe(livereload());
});

gulp.task('sass', function () {
  return gulp.src('./src/css/style.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./public'))
    .pipe(livereload());
});

gulp.task('all', function() {
  livereload.listen();
  gulp.watch('src/js/*.js', ['js']);
  gulp.watch('public/*.html', ['html']);
  gulp.watch('src/css/*.scss', ['sass']);
});

gulp.task('watch', ['all'], function() {
  return nodemon({
    script: 'server.js'
  });
});
