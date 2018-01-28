(function () {
  "use strict";

  const gulp = require('gulp');
  const sass = require('gulp-sass');
  const browserSync = require('browser-sync');
  const sourcemaps = require('gulp-sourcemaps');
  const browserify = require('gulp-browserify');
  const babel = require('gulp-babel');
  const concat = require('gulp-concat');
  const uglify = require('gulp-uglify');
  const wait = require('gulp-wait');
  const svgmin = require('gulp-svgmin');
  const autoprefixer = require('gulp-autoprefixer');
  const imagemin = require('gulp-imagemin');
  const reload = browserSync.reload;




  gulp.task('babel', () => {
    gulp.src('./source/scripts/**/*.js')
      .pipe(sourcemaps.init())
      .on('error', onError)
      .pipe(babel({
        presets: ['env']
      }))
      .pipe(browserify({
          debug : true
        }))
      .pipe(concat('index.js'))
      .on('error', onError)
      .pipe(sourcemaps.write('.'))

      .pipe(gulp.dest('dist/js'));
  });
  gulp.task('babel-watch', ['babel'], (done) => {
    browserSync.reload();
    done();
  });

  gulp.task('svg', ()=> {
    gulp.src('source/svg/**/*.svg')
      .pipe(svgmin({
        plugins: [{
          removeDoctype: true
        }, {
          removeComments: true
        }, {
          cleanupNumericValues: {
            floatPrecision: 2
          }
        }, {
          convertColors: {
            names2hex: true,
            rgb2hex: true
          }
        }],
         js2svg: {
                pretty: true
            }
      }))
      .on('error', onError)
      .pipe(gulp.dest('dist/svg'));
  });
  gulp.task('svg-watch', ['svg'], function(done) {
    browserSync.reload();
    done();
  });
  gulp.task('img', ()=> {
    gulp.src('source/img/**/*.*')
      .pipe(imagemin([
	      imagemin.gifsicle({interlaced: true}),
	      imagemin.jpegtran({progressive: true}),
	      imagemin.optipng({optimizationLevel: 5})]))
      .on('error', onError)
      .pipe(gulp.dest('dist/img'));
  });
  gulp.task('img-watch', ['img'], function(done) {
    browserSync.reload();
    done();
  });

  gulp.task('sass', function () {
    gulp.src('source/scss/**/*.scss')
      .pipe(sass({ includePaths: ['scss'] }))
      .on('error', onError)
      .pipe(autoprefixer({
          browsers: ['last 2 versions'],
          cascade: false
      }))
      .on('error', onError)
      .pipe(gulp.dest('dist/css'));
  });

  gulp.task('sass-watch', ['sass'], function (done) {
    browserSync.reload();
    done();
  });


  gulp.task('default', ['sass', 'babel', 'svg', 'img'], function () {
    browserSync.init(["css/*.css", "js/*.js", "svg/*.svg", "img/*.*"], {
      server: {
        baseDir: "./dist"
      }
    });
    gulp.watch("dist/*.html", reload);
    gulp.watch("source/scripts/**/*.js", ['babel-watch']);
    gulp.watch("source/scss/**/*.scss", ['sass-watch']);
    gulp.watch("source/svg/**/*.svg", ['svg-watch']);
    gulp.watch("source/img/**/*.*", ['img-watch']);
  });


  function onError(err) {
    console.log(err);
    this.emit('end');
  }

}());



