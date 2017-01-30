'use strict';

const gulp = require('gulp');
const babel = require('gulp-babel');
const plumber = require('gulp-plumber');
const stylus = require('gulp-stylus');
const sass = require('gulp-sass');
const less = require('gulp-less');
const poststylus = require('poststylus');
const rucksack = require('rucksack-css');
const flexibility = require('postcss-flexibility');
const prefixer = require('autoprefixer');
const fontMagician = require('postcss-font-magician');
const gcmq = require('gulp-group-css-media-queries');
const cssnano = require('gulp-cssnano');
const sourcemaps = require('gulp-sourcemaps');
const lost = require('lost');
const rupture = require('rupture');
const postcss = require('gulp-postcss');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const pug = require('gulp-pug');
const data = require('gulp-data');
const yaml = require('js-yaml');
const imagemin = require('gulp-imagemin');
const browserSync = require('browser-sync');
const svgmin = require('gulp-svgmin');
const svgstore = require('gulp-svgstore');
const cheerio = require('gulp-cheerio');
const mdcss = require('mdcss');
const fs = require('fs');
const del = require('del');
const merge = require('merge-stream');
const fileExists = require('file-exists');

const srcApp = {
  js: [
    'src/js/**/*.js'
  ],
  styl: 'src/styl/main.styl',
  less: 'src/less/main.less',
  sass: 'src/sass/main.scss',
  html: 'src/html/*.html',
  pug: 'src/pug/*.pug',
  icons: 'src/svg/icons/*',
  svg: 'src/svg/',
  img: 'src/img/**/*',
  data: 'src/data/'
};

const buildApp = {
  build: 'build/**/*',
  js: 'build/js/',
  css: 'build/css/',
  html: 'build/',
  img: 'build/img',
  svg: 'build/svg'
};

let dataJson = {};
let files = [];


const stylingFunction = (options) => (gulp.src(options.src)
  .pipe(plumber())
  .pipe(sourcemaps.init())
  .pipe(options.settings))

const stylusSettings = {
  name: 'stylus',
  src: srcApp.styl,
  settings: stylus({
      use: [
        rupture(),
        poststylus([
          lost(),
          fontMagician(),
          rucksack(),
          flexibility(),
          prefixer()
        ])
      ],
      compress: false
    })
}

const sassSettings = {
  name: 'sass',
  src: srcApp.sass,
  settings: sass()
}

const lessSettings = {
  name: 'less',
  src: srcApp.less,
  settings: less()
}

gulp.task('clean', () => {
  return del(buildApp.build);
});

gulp.task('css', () => {
  if (fileExists(srcApp.styl)) {
    return stylingFunction(stylusSettings)
      .pipe(gcmq())
      .pipe(cssnano())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(buildApp.css));
  } else if (fileExists(srcApp.sass)) {
    return stylingFunction(sassSettings)
      .pipe(postcss([
          lost(),
          fontMagician(),
          rucksack({
            autoprefixer: true
          })
        ]))
      .pipe(gcmq())
      .pipe(cssnano())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(buildApp.css));
  } else if (fileExists(srcApp.less)) {
    return stylingFunction(lessSettings)
      .pipe(postcss([
          lost(),
          fontMagician(),
          rucksack({
            autoprefixer: true
          })
        ]))
      .pipe(gcmq())
      .pipe(cssnano())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(buildApp.css));
  } else {
    return
  }
});

gulp.task('js', () => {
  return gulp.src(srcApp.js)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(buildApp.js));
});

gulp.task('read:data', () => {
  fs.readdir(srcApp.data, (err, items) => {
    for (var i = 0; i < items.length; i++) {
      files.push(items[i].split('.')[0]);
    }
    for (var i = 0; i < files.length; i++) {
      dataJson[files[i]] = yaml.safeLoad(fs.readFileSync(srcApp.data + '/' + files[i] + '.yml', 'utf-8'));
    }
  });
});

gulp.task('pug', () => {
  return gulp.src(srcApp.pug)
    .pipe(plumber())
    .pipe(data(dataJson))
    .pipe(pug())
    .pipe(gulp.dest(buildApp.html));
});

gulp.task('html', () => {
  return gulp.src(srcApp.html)
    .pipe(plumber())
    .pipe(gulp.dest(buildApp.html));
});

gulp.task('images', () => {
  return gulp.src(srcApp.img)
    .pipe(plumber())
    .pipe(imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest(buildApp.img));
});

gulp.task('svg', () => {
  gulp.src(srcApp.svg)
    .pipe(svgmin())
    .pipe(gulp.dest(srcApp.svg));
  gulp.src(srcApp.svg)
    .pipe(svgmin())
    .pipe(gulp.dest(buildApp.svg));
});

gulp.task('icons', () => {
  return gulp.src(srcApp.icons)
    .pipe(svgmin())
    .pipe(svgstore({ fileName: 'icons.svg', inlineSvg: true }))
    .pipe(cheerio({
      run: function ($, file) {
        $('svg').addClass('hide');
        $('[fill]').removeAttr('fill');
      },

      parserOptions: { xmlMode: true }
    }))
    .pipe(gulp.dest(buildApp.svg));
});

gulp.task('watch', () => {
  gulp.watch(srcApp.html, { debounceDelay: 300 }, ['html']);
  gulp.watch(srcApp.data + '**/*', { debounceDelay: 300 }, ['read:data', 'html']);
  gulp.watch(srcApp.css, ['css']);
  gulp.watch(srcApp.js, ['js']);
  gulp.watch(srcApp.img, ['images']);
  gulp.watch(srcApp.icons, ['icons']);
});

gulp.task('browser-sync', () => {
  var files = [
    buildApp.build
  ];

  browserSync.init(files, {
    server: {
      baseDir: './build/'
    },
  });

});

gulp.task('build', ['clean'], () => {
  gulp.start(
    'pug',
    'html',
    'css',
    'read:data',
    'js',
    'images',
    'svg',
    'icons'
  );
});

gulp.task('default', [
  'build',
  'watch',
  'browser-sync'
]);
