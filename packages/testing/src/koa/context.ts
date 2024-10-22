import Stream from 'stream';

import Koa from 'koa';

// @source https://github.com/koajs/koa/blob/e9494b5b3e040e4427710649f28b6cfa3b3ae845/test-helpers/context.js

export function createContext(req?: any, res?: any, app?: Koa) {
  const socket = new Stream.Duplex();
  req = { headers: {}, socket, ...Stream.Readable.prototype, ...req };
  res = { _headers: {}, socket, ...Stream.Writable.prototype, ...res };
  req.socket.remoteAddress = req.socket.remoteAddress || '127.0.0.1';
  app = app || new Koa();
  res.getHeader = (k: string) => res._headers[k.toLowerCase()];
  res.setHeader = (k: string, v: string) => {
    res._headers[k.toLowerCase()] = v;
  };
  res.removeHeader = (k: string, v: string) => delete res._headers[k.toLowerCase()];
  return app.createContext(req, res);
}

export const request = (req?: any, res?: any, app?: Koa) => createContext(req, res, app).request;

export const response = (req?: any, res?: any, app?: Koa) => createContext(req, res, app).response;
