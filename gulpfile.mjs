import gulp from 'gulp';
import htmlMinifier from 'html-minifier';
import * as csso from 'csso';
import uglifyJs from 'uglify-js';
import fs from 'node:fs';
import { Transform } from 'node:stream';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import icoEndec from 'ico-endec';
import server from './server.mjs';

const distFolder = 'dist/';

const userEnv = {};

if (fs.existsSync('.env')) {
  const envFile = fs.readFileSync('.env');
  console.log(envFile.toString());
  envFile
    .toString()
    .split('\n')
    .filter((i) => i !== '')
    .forEach((entry) => {
      const env = entry.split('=', 2).map((e) => e.trim());
      userEnv[env[0]] = env[1];
    });
}

const env = {
  ...process.env,
  ...userEnv,
};

if (!('MYNTBREYTA_SITE_URL' in env)) {
  throw new Error('"MYNTBREYTA_SITE_URL" is not set');
}

const siteUrl = env.MYNTBREYTA_SITE_URL;

let shouldMinify = true;

const clean = (cb) => {
  fs.rmSync(distFolder, { recursive: true, force: true });
  cb();
};

const staticFiles = (cb) => {
  gulp
    .src('src/robots.txt', { encoding: false })
    .pipe(replaceSiteUrl())
    .pipe(gulp.dest(distFolder));
  gulp
    .src('src/sitemap.xml', { encoding: false })
    .pipe(replaceSiteUrl())
    .pipe(gulp.dest(distFolder));
  gulp
    .src('src/assets/images/icon.svg', { encoding: false })
    .pipe(convertToPng('apple-touch-icon.png', 180))
    .pipe(revision())
    .pipe(gulp.dest(distFolder + 'assets/images/'));
  gulp
    .src('src/assets/images/icon.svg', { encoding: false })
    .pipe(convertToPng('icon-96x96.png', 96))
    .pipe(revision())
    .pipe(gulp.dest(distFolder + 'assets/images/'));
  gulp
    .src('src/assets/images/icon.svg', { encoding: false })
    .pipe(convertToPng('icon-192x192.png', 192))
    .pipe(revision())
    .pipe(gulp.dest(distFolder + 'assets/images/'));
  gulp
    .src('src/assets/images/icon.svg', { encoding: false })
    .pipe(convertToPng('icon-512x512.png', 512))
    .pipe(revision())
    .pipe(gulp.dest(distFolder + 'assets/images/'));
  gulp
    .src('src/assets/images/icon.svg', { encoding: false })
    .pipe(convertToPng('icon.ico', 32))
    .pipe(convertToIco())
    .pipe(revision())
    .pipe(gulp.dest(distFolder + 'assets/images/'));
  gulp
    .src('src/assets/images/icon.svg', { encoding: false })
    .pipe(revision())
    .pipe(gulp.dest(distFolder + 'assets/images/'));
  gulp.src('./src/**/*.json').pipe(gulp.dest(distFolder));
  cb();
};

const replaceSiteUrl = () =>
  new Transform({
    objectMode: true,
    transform(file, encoding, callback) {
      if (file.isBuffer()) {
        let contents = file.contents.toString();
        contents = contents.replaceAll('MYNTBREYTA_SITE_URL', siteUrl);
        file.contents = Buffer.from(contents);
      }
      callback(null, file);
    },
  });

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

const setStyleAsInline = () =>
  new Transform({
    objectMode: true,
    transform(file, encoding, callback) {
      if (file.isBuffer()) {
        const css = fs.readFileSync('src/assets/css/app-shell.css');
        let contents = file.contents.toString();
        contents = contents.replace('<style></style>', `<style>${css}</style>`);
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

const convertToPng = (name, size) =>
  new Transform({
    objectMode: true,
    transform(file, encoding, callback) {
      if (!file.isBuffer()) {
        callback(null, file);
        return;
      }
      sharp(file.contents)
        .resize(size)
        .png({ compressionLevel: 8 })
        .toBuffer()
        .then((contents) => {
          file.contents = contents;
          file.path = path.dirname(file.path) + '/' + name;
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => callback(null, file));
    },
  });

const convertToIco = (name, size) =>
  new Transform({
    objectMode: true,
    transform(file, encoding, callback) {
      if (file.isBuffer()) {
        file.contents = icoEndec.encode([file.contents]);
      }
      callback(null, file);
    },
  });

const minifyHTML = () =>
  new Transform({
    objectMode: true,
    transform(file, encoding, callback) {
      if (file.isBuffer() && shouldMinify) {
        let minifiedHTML = htmlMinifier.minify(file.contents.toString(), {
          collapseWhitespace: true,
          decodeEntities: true,
          html5: true,
          minifyCSS: true,
          minifyJS: true,
          removeComments: true,
        });
        [
          ...minifiedHTML.matchAll(
            /<script type="application\/ld\+json">(?<json>.*?)<\/script>/gs,
          ),
        ].forEach(
          (m) =>
            (minifiedHTML = minifiedHTML.replace(
              m.groups['json'],
              JSON.stringify(JSON.parse(m.groups['json'])),
            )),
        );

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

const updatePackageVersion = () =>
  new Transform({
    objectMode: true,
    transform(file, encoding, callback) {
      if (file.isBuffer()) {
        const packageVersion = JSON.parse(
          fs.readFileSync('package.json'),
        ).version;
        let contents = file.contents.toString();
        contents = contents.replace('RELEASE_VERSION', `v${packageVersion}`);
        file.contents = Buffer.from(contents);
      }
      callback(null, file);
    },
  });

const serviceWorker = () =>
  gulp
    .src('./src/sw.js')
    .pipe(updatePackageVersion())
    .pipe(minifyJS())
    .pipe(gulp.dest(distFolder));

const webmanifest = () =>
  gulp
    .src('src/**/app.webmanifest')
    .pipe(revision())
    .pipe(replaceRevisionFiles())
    .pipe(gulp.dest(distFolder));

const html = () =>
  gulp
    .src('src/**/*.html')
    .pipe(replaceRevisionFiles())
    .pipe(minifyHTML())
    .pipe(gulp.dest(distFolder));

const errorPage = () =>
  gulp
    .src('src/error.html')
    .pipe(setStyleAsInline())
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
  const port = 3000;
  const host = '0.0.0.0';
  server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
  });
  cb();
};

gulp.task(
  'build',
  gulp.series(
    clean,
    gulp.parallel(staticFiles, serviceWorker, javascript, css),
    webmanifest,
    html,
    errorPage,
  ),
);

export default (cb) => {
  shouldMinify = false;
  clean(() => {});
  staticFiles(() => {});
  gulp.watch(
    'src/**/*.{css,js,html}',
    { ignoreInitial: false },
    gulp.series(css, javascript, webmanifest, serviceWorker, html, errorPage),
  );
  developmentServer(() => {});
  cb();
};
