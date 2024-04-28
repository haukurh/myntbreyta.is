import gulp from 'gulp';
import replace from 'gulp-replace';
import htmlJs from 'html-minifier';
import * as cssJs from 'csso';
import jsJs from 'uglify-js';
import fs from 'node:fs';
import { Transform } from 'node:stream';
import path from 'node:path';
import crypto from 'node:crypto';

const distFolder = 'dist/';

function clean(cb) {
  fs.rmSync(distFolder, { recursive: true });
  cb();
}

function staticFiles(cb) {
  gulp.src('./src/**/*.ico').pipe(gulp.dest(distFolder));
  gulp.src('./src/**/*.json').pipe(gulp.dest(distFolder));
  gulp.src('./src/sw.js').pipe(gulp.dest(distFolder));
  cb();
}

const handleMinifiedUrls = (data) => {
  let filename = 'src';
  const match = data.match(/"(?<filename>.*)"/);
  if (!match) {
    return data;
  }
  filename += match.groups.filename;

  if (!fs.existsSync(filename)) {
    return data;
  }

  return data.replace('.css"', '.min.css"').replace('.js"', '.min.js"');
};

const revisionedFiles = {};

const revision = () =>
  new Transform({
    objectMode: true,
    transform(file, encoding, callback) {
      if (file.isBuffer()) {
        const hash = crypto
          .createHash('md5')
          .update(file.contents.toString())
          .digest('hex');
        const key = file.relative;
        const ext = path.extname(file.path);
        file.path =
          file.path.substring(0, file.path.length - ext.length) +
          '-' +
          hash.substring(0, 8) +
          ext;
        revisionedFiles[key] = file.relative;
      }
      callback(null, file);
    },
  });

const minifyHTML = () =>
  new Transform({
    objectMode: true,
    transform(file, encoding, callback) {
      if (file.isBuffer()) {
        const minifiedHTML = htmlJs.minify(file.contents.toString(), {
          collapseWhitespace: true,
          decodeEntities: true,
          html5: true,
          minifyCSS: true,
          minifyJS: true,
          removeComments: true,
        });
        file.contents = Buffer.from(minifiedHTML);
      }
      callback(null, file);
    },
  });

const minifyJS = () =>
  new Transform({
    objectMode: true,
    transform(file, encoding, callback) {
      if (file.isBuffer()) {
        const minifiedJs = jsJs.minify(file.contents.toString());
        file.contents = Buffer.from(minifiedJs.code);
      }
      callback(null, file);
    },
  });

const minifyCSS = () =>
  new Transform({
    objectMode: true,
    transform(file, encoding, callback) {
      if (file.isBuffer()) {
        const css = cssJs.minify(file.contents.toString()).css;
        file.contents = Buffer.from(css);
      }
      callback(null, file);
    },
  });

function html() {
  return gulp
    .src('src/**/*.html')
    .pipe(replace(/(href|src)="(.+?(\.js|\.css))"/g, handleMinifiedUrls))
    .pipe(minifyHTML())
    .pipe(gulp.dest(distFolder));
}

function javascript(cb) {
  return gulp
    .src(['src/**/*.js', '!src/sw.js'])
    .pipe(minifyJS())
    .pipe(revision())
    .pipe(gulp.dest(distFolder));
}

function css() {
  return gulp
    .src('src/**/*.css')
    .pipe(minifyCSS())
    .pipe(revision())
    .pipe(gulp.dest(distFolder));
}

gulp.task('build', gulp.series(clean, staticFiles, javascript, css, html));

export default (cb) => {
  clean(() => {});
  staticFiles(() => {});
  gulp.watch('src/**/*.css', { ignoreInitial: false }, css);
  gulp.watch('src/**/*.html', { ignoreInitial: false }, html);
  gulp.watch('src/**/*.js', { ignoreInitial: false }, javascript);
  cb();
};
