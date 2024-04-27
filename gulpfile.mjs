import gulp from 'gulp';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import through2 from 'through2';
import htmlJs from 'html-minifier';
import * as cssJs from 'csso';
import jsJs from 'uglify-js';
import fs from 'node:fs';

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

function html() {
  return gulp
    .src('src/**/*.html')
    .pipe(replace(/(href|src)="(.+?(\.js|\.css))"/g, handleMinifiedUrls))
    .pipe(
      through2.obj(function (file, _, cb) {
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
        cb(null, file);
      }),
    )
    .pipe(gulp.dest(distFolder));
}

function javascript() {
  return gulp
    .src(['src/**/*.js', '!src/sw.js'])
    .pipe(
      through2.obj(function (file, _, cb) {
        if (file.isBuffer()) {
          const minifiedJs = jsJs.minify(file.contents.toString());
          file.contents = Buffer.from(minifiedJs.code);
        }
        cb(null, file);
      }),
    )
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest(distFolder));
}

function css() {
  return gulp
    .src('src/**/*.css')
    .pipe(
      through2.obj(function (file, _, cb) {
        if (file.isBuffer()) {
          const css = cssJs.minify(file.contents.toString()).css;
          file.contents = Buffer.from(css);
        }
        cb(null, file);
      }),
    )
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest(distFolder));
}

gulp.task('build', gulp.series(clean, staticFiles, html, css, javascript));

export default (cb) => {
  clean(() => {});
  staticFiles(() => {});
  gulp.watch('src/**/*.css', { ignoreInitial: false }, css);
  gulp.watch('src/**/*.html', { ignoreInitial: false }, html);
  gulp.watch('src/**/*.js', { ignoreInitial: false }, javascript);
  cb();
};
