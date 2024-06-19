import path from 'node:path';

import Router from 'koa-router';

function getApiPath() {
  const err = new Error();
  const stack = err.stack!.split('\n');
  const callerLine = stack[3];
  const callerPath = callerLine.match(/\((.*):[0-9]+:[0-9]+\)/)![1];

  const __filename = path.resolve(callerPath);

  let relativePath = __filename.split('/connect-api/src')[1];

  relativePath = relativePath.replace(/\\/g, '/'); // For Windows compatibility
  if (relativePath.endsWith('/index.ts')) {
    relativePath = relativePath.replace('/index.ts', '');
  } else {
    relativePath = relativePath.replace('.ts', '');
  }

  return `${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
}

export class PathBasedRouter extends Router {
  constructor() {
    super({ prefix: getApiPath() });
  }

  GET(...handlers: Router.IMiddleware[]) {
    super.get('/', ...handlers);
  }

  POST(...handlers: Router.IMiddleware[]) {
    super.post('/', ...handlers);
  }

  PUT(...handlers: Router.IMiddleware[]) {
    super.put('/', ...handlers);
  }

  DELETE(...handlers: Router.IMiddleware[]) {
    super.delete('/', ...handlers);
  }
}
