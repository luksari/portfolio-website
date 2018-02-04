(function () {
  "use strict";

  const gulp = require('gulp');                       /*Import gulp */
  const sass = require('gulp-sass');                  /*Transpile SCSS to CSS */
  const browserSync = require('browser-sync');        /*Hot reload */
  const sourcemaps = require('gulp-sourcemaps');      /*Creates source-map for uglified JS file */
  const browserify = require('gulp-browserify');      /*Gives browser access to e.g require expression */
  const babel = require('gulp-babel');                /*Transpile ES6 */
  const concat = require('gulp-concat');              /*Creates one file from few files */
  const uglify = require('gulp-uglify');              /*Minify JS */
  const wait = require('gulp-wait');                  /*Helper to improve hot reload */
  const svgmin = require('gulp-svgmin');              /*Minify SVG */
  const autoprefixer = require('gulp-autoprefixer');  /*Autoprefix CSS*/
  const imagemin = require('gulp-imagemin');          /*Minify png, jpg, jpeg */
  const reload = browserSync.reload;                  /*Hot reload */



/* Transpile ES6  */
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
  /*Watch for js changes */
  gulp.task('babel-watch', ['babel'], (done) => {
    browserSync.reload();
    done();
  });
/*Minify SVG */
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
/*Watch for svg changes */
  gulp.task('svg-watch', ['svg'], function(done) {
    browserSync.reload();
    done();
  });
  /*Minify png, jpg, jpeg, gif etc. */
  gulp.task('img', ()=> {
    gulp.src('source/img/**/*.*')
      .pipe(imagemin([
	      imagemin.gifsicle({interlaced: true}),
	      imagemin.jpegtran({progressive: true}),
	      imagemin.optipng({optimizationLevel: 5})]))
      .on('error', onError)
      .pipe(gulp.dest('dist/img'));
  });
/*Watch for images changes */
  gulp.task('img-watch', ['img'], function(done) {
    browserSync.reload();
    done();
  });
/*Transpile scss to css*/
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
/*Watch for scss changes */
  gulp.task('sass-watch', ['sass'], function (done) {
    browserSync.reload();
    done();
  });

/*Runs all tasks */
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

/*Error handling */
  function onError(err) {
    console.log(err);
    this.emit('end');
  }

}());



