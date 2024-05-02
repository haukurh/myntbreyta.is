import http from 'node:http';
import { readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const started = new Date();
started.setHours(started.getHours() + 2);

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
          res.setHeader('Cache-Control', 'public,max-age=60');
        }
        res.writeHead(200);
        res.end(readFileSync(`./dist/${urlPath}`));
      } else {
        res.setHeader('Content-Type', 'text/plain');
        res.writeHead(404);
        res.end('Not Found!');
      }
      break;
  }
};

const server = http.createServer(requestListener);
export default server;
