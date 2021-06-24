var fs = require('fs'),
    gulp = require('gulp'),
    pug = require('gulp-pug'),
    sass = require('gulp-sass'),
    postcss = require('gulp-postcss'),
    rucksack = require("rucksack-css"),
    autoprefixer = require('autoprefixer'),
    cleancss = require("gulp-clean-css"),
    //jshint = require('gulp-jshint'),
    concat = require('gulp-concat'),
    babel = require('gulp-babel'),
    uglify = require("gulp-uglify"),
    imagemin = require('gulp-imagemin'),
    cache = require("gulp-cache"),
    sourcemaps = require('gulp-sourcemaps'),
    rename = require('gulp-rename'),
    browserSync = require('browser-sync').create();

var paths = {
    dest: "./dist/",
    sourcemaps: "./maps",
    pug: {watch:'./src/pug/**/*.pug', src:'./src/pug/*.pug', dir:'./src/pug/'},
    json: {watch:'./src/json/*.json', src: './src/json/*.json'},
    scss: {src:"./src/scss/*.scss", dest:"./dist/css"},
    js: {src:"./src/js/*.js", dest: './dist/js/'},
    txt: './src/txt/*.txt',
    favicon: './src/favicon.*',
    // htaccess: './src/.htaccess',
    img: {src:'./src/img/**/*.+(png|jpg|jpeg|gif|svg)', dest:'./dist/img'},
    vid: {src:'./src/vid/**/*.+(mp4)', dest:'./dist/vid'},
    fonts: {src:'./src/assets/**/*.{ttf,woff,woff2,eot,svg}', dest:'./dist/assets'}
};

gulp.task('jsonPug', function () {
    var getData = function (fn) {
        return JSON.parse(fs.readFileSync(paths.json.src.replace("*", fn)));
    };
    var pageMap = getData("pages");
    var scripts = {
        dev: [
            "js/jquery/jquery.js",
            "js/controller.js"
        ],
        prod: [
            "js/jquery/jquery.min.js",
            "js/compiled-bundle.min.js"
        ]
    };
    if (pageMap.length === 0) {
      console.log('no Pages')
      return true
    }
    var lang = ['fr'/*, 'en', 'es'*/]
    // var header = getData('header')[0]
    for (l in lang) {
      for (var i = 0; i < pageMap.length; i++) {
        var p = pageMap[i]
        if (!p.hasOwnProperty('content')) {} else {
          var data = []
          for (j in p.content.data) {
            data[p.content.data[j]] = getData(p.content.data[j])
          }
          // var headerTmp = JSON.parse(JSON.stringify(header))
          var pageTmp = JSON.parse(JSON.stringify(p))
          var fileName = p.page_title.toLowerCase().replace(/ /g, '-')
          gulp.src(paths.pug.dir + p.content.template + '.pug').pipe(pug({
            pretty: false,
            locals: {
              fileName: fileName,
              // header: headerTmp,
              language: lang[l],
              data: data,
              page: pageTmp,
              scripts: scripts.prod
            }
          }))
          .pipe(rename(fileName + '.html'))
          .pipe(gulp.dest('./dist/' + (lang[l] == "fr" ? "" : lang[l] + '/')), {overwrite: true})
          .pipe(browserSync.reload({stream: true}))
        }
      }
    }
    return gulp.src('*')
});

gulp.task('css', function () {
  var processors = [autoprefixer({browsers: "last 3 versions"}),
      rucksack];
  return gulp.src(paths.scss.src)
        //.pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(processors))
        .pipe(cleancss())
        //.pipe(sourcemaps.write(paths.sourcemaps))
        .pipe(gulp.dest(paths.scss.dest))
        .pipe(browserSync.reload({
          stream: true
        }));
});

gulp.task("bundleJs", function () {
  return gulp.src(paths.js.src)
        //.pipe(sourcemaps.init())
        .pipe(babel({presets: ['@babel/env']}))
        .pipe(concat("compiled-bundle.min.js"))
        .pipe(uglify())
        //.pipe(sourcemaps.write(paths.sourcemaps))
        .pipe(gulp.dest(paths.js.dest))
        .pipe(browserSync.reload({
          stream: true
        }));
});

gulp.task('txt', function() {
  return gulp.src(paths.txt)
        .pipe(gulp.dest(paths.dest));
});

gulp.task('favicon', function(){
  return gulp.src(paths.favicon)
        .pipe(gulp.dest(paths.dest));
});

// gulp.task('misc', function () {
//   return gulp.src(paths.htaccess)
//         .pipe(gulp.dest(paths.dest));
// });

gulp.task('images', function() {
  return gulp.src('./src/img/**/*.+(png|jpg|jpeg|gif|svg)')
        .pipe(/*cache(*/imagemin({interlaced: true})/*)*/)
        .pipe(gulp.dest(paths.img.dest));
});

gulp.task('clear', () => cache.clearAll());

gulp.task('video', function() {
  return gulp.src(paths.vid.src)
        .pipe(gulp.dest(paths.vid.dest));
});

gulp.task('fonts', function() {
  return gulp.src(paths.fonts.src)
        .pipe(gulp.dest(paths.fonts.dest));
});

gulp.task('copyfiles',
  gulp.parallel('fonts', 'txt', 'images', 'video', 'favicon'/*, 'misc'*/),
  gulp.watch(paths.txt, gulp.series('txt')),
  gulp.watch(paths.favicon, gulp.series('favicon')),
  // gulp.watch(paths.htaccess,gulp.series('misc')),
  gulp.watch(paths.img.src, gulp.series('images')),
  gulp.watch(paths.vid.src, gulp.series('video')),
  gulp.watch(paths.fonts.src, gulp.series('fonts'))
);

gulp.task('browserSync', function() {
  return browserSync.init ({
    server: {
      baseDir: paths.dest
    },
  });
});

gulp.task("w-a", function () {
    gulp.watch(paths.scss.src, gulp.series('css'));
    gulp.watch(paths.js.src, gulp.series('bundleJs'));
    gulp.watch([paths.pug.watch, paths.json.watch], gulp.series('jsonPug'));
});

gulp.task("d-a", (function () {
  return gulp.parallel(['jsonPug', 'css', 'bundleJs', 'copyfiles']);
})());

gulp.task("default", gulp.series('d-a', gulp.parallel('browserSync', 'w-a')));
