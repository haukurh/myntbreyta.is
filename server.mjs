import http from 'node:http';
import { readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const started = new Date();
started.setMinutes(started.getMinutes() + 1);

const requestListener = function (req, res) {
  const urlPath =
    url.parse(req.url).pathname !== '/'
      ? url.parse(req.url).pathname
      : '/index.html';
  const ext = path.extname(urlPath);
  const contentTypes = {
    '.json': 'application/json',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.txt': 'text/plain',
    '.xml': 'text/xml',
    '.html': 'text/html',
    '.ico': 'image/vnd.microsoft.icon',
  };

  console.log(new Date().toUTCString() + ' ' + urlPath);
  switch (urlPath) {
    case '/currency-rates.json':
      if (existsSync(`./dist/${urlPath}`)) {
        const stats = statSync(`./dist/${urlPath}`);
        res.setHeader('Last-Modified', stats.mtime.toUTCString());
        res.setHeader('Expires', started.toUTCString());
      }
    default:
      if (existsSync(`./dist/${urlPath}`)) {
        res.setHeader(
          'Content-Type',
          ext in contentTypes ? contentTypes[ext] : 'text/plain',
        );
        if (urlPath !== '/currency-rates.json') {
          res.setHeader(
            'Cache-Control',
            urlPath === '/sw.js' ? 'no-cache,no-store' : 'public,max-age=3600',
          );
        }
        res.writeHead(200);
        res.end(readFileSync(`./dist/${urlPath}`));
      } else {
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(404);
        res.end(readFileSync('./dist/error.html'));
      }
      break;
  }
};

const server = http.createServer(requestListener);
export default server;
