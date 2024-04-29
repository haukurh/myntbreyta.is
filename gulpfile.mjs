import gulp from 'gulp';
import htmlMinifier from 'html-minifier';
import * as csso from 'csso';
import uglifyJs from 'uglify-js';
import fs from 'node:fs';
import { Transform } from 'node:stream';
import path from 'node:path';
import crypto from 'node:crypto';
import server from './server.mjs';

const distFolder = 'dist/';

let shouldMinify = true;

const clean = (cb) => {
  fs.rmSync(distFolder, { recursive: true, force: true });
  cb();
};

const staticFiles = (cb) => {
  gulp.src('./src/**/*.ico').pipe(gulp.dest(distFolder));
  gulp.src('./src/**/*.json').pipe(gulp.dest(distFolder));
  gulp.src('./src/sw.js').pipe(gulp.dest(distFolder));
  cb();
};

const revisionedFiles = {};

const replaceRevisionFiles = () =>
  new Transform({
    objectMode: true,
    transform(file, encoding, callback) {
      if (file.isBuffer()) {
        let contents = file.contents.toString();
        Object.keys(revisionedFiles).forEach((key) => {
          contents = contents.replaceAll(key, revisionedFiles[key]);
        });
        file.contents = Buffer.from(contents);
      }
      callback(null, file);
    },
  });

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
      if (file.isBuffer() && shouldMinify) {
        const minifiedHTML = htmlMinifier.minify(file.contents.toString(), {
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
      if (file.isBuffer() && shouldMinify) {
        const minifiedJs = uglifyJs.minify(file.contents.toString());
        file.contents = Buffer.from(minifiedJs.code);
      }
      callback(null, file);
    },
  });

const minifyCSS = () =>
  new Transform({
    objectMode: true,
    transform(file, encoding, callback) {
      if (file.isBuffer() && shouldMinify) {
        const css = csso.minify(file.contents.toString()).css;
        file.contents = Buffer.from(css);
      }
      callback(null, file);
    },
  });

const html = () =>
  gulp
    .src('src/**/*.html')
    .pipe(replaceRevisionFiles())
    .pipe(minifyHTML())
    .pipe(gulp.dest(distFolder));

const javascript = () =>
  gulp
    .src(['src/**/*.js', '!src/sw.js'])
    .pipe(minifyJS())
    .pipe(revision())
    .pipe(gulp.dest(distFolder));

const css = () =>
  gulp
    .src('src/**/*.css')
    .pipe(minifyCSS())
    .pipe(revision())
    .pipe(gulp.dest(distFolder));

const developmentServer = (cb) => {
  const port = 8000;
  const host = '0.0.0.0';
  server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
  });
  cb();
};

gulp.task(
  'build',
  gulp.series(clean, gulp.parallel(staticFiles, javascript, css), html),
);

export default (cb) => {
  shouldMinify = false;
  gulp.parallel(clean, staticFiles);
  gulp.watch(
    'src/**/*.{css,js,html}',
    { ignoreInitial: false },
    gulp.series(css, javascript, html),
  );
  developmentServer(() => {});
  cb();
};
