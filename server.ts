import type { Server } from 'http';
import { createServer } from 'http';
import { join } from 'path';
import { parse } from 'url';

import next from 'next';

import { appEnv } from './config/constants';
import log from './lib/log';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port, customServer: false });
const handle = app.getRequestHandler();

let server: Server;

app.prepare().then(() => {
  server = createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url as string, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      log.error('[server] Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Something went wrong');
    }
  })
    .once('error', (err) => {
      log.error('[server] Next.js server error', err);
      process.exit(1);
    })
    .listen(port, () => {
      log.info(`[server] Next.js server running in ${appEnv}: http://${hostname}:${port}`);
    });
});

function cleanup() {
  log.info('[server] Closing Next.js server connections...');
  server?.close(() => {
    log.info('[server] Exiting process...');
    process.exit(1);
  });
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
