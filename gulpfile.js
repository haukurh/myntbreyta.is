const { watch, series, src, dest } = require('gulp');
const rename = require('gulp-rename');
const through2 = require('through2');
const htmlJs = require('html-minifier');
const cssJs = require('csso');
const jsJs = require("uglify-js");
const del = require('del');

const distFolder = 'dist/';

function clean(cb) {
    del.sync(distFolder);
    cb();
}

function staticFiles(cb) {
    src('./src/*.ico')
        .pipe(dest(distFolder));
    cb();
}

function html(cb) {
    src('src/*.html')
        .pipe(through2.obj(function(file, _, cb) {
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
        }))
        .pipe(dest(distFolder));
    cb();
}

function javascript(cb) {
    src('src/*.js')
        .pipe(through2.obj(function(file, _, cb) {
            if (file.isBuffer()) {
                const minifiedJs = jsJs.minify(file.contents.toString());
                file.contents = Buffer.from(minifiedJs.code);
            }
            cb(null, file);
        }))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(dest(distFolder));
    cb();
}

function css(cb) {
    src('src/*.css')
        .pipe(through2.obj(function(file, _, cb) {
            if (file.isBuffer()) {
                const css = cssJs.minify(file.contents.toString()).css;
                file.contents = Buffer.from(css);
            }
            cb(null, file);
        }))
        .pipe(rename({ extname: '.min.css' }))
        .pipe(dest(distFolder));
    cb();
}

exports.build = series(clean, staticFiles, html, css, javascript);

exports.default = function(cb) {
    clean(() => {});
    staticFiles(() => {});
    watch('src/*.css', { ignoreInitial: false }, css);
    watch('src/*.html', { ignoreInitial: false }, html);
    watch('src/*.js', { ignoreInitial: false }, javascript);
    cb();
};
