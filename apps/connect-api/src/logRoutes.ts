import { log } from '@charmverse/core/log';
import type { ParameterizedContext } from 'koa';
import type Router from 'koa-router';

import { isDevEnv } from './constants';

// Define terminal color codes
const RESET = isDevEnv ? '\x1b[0m' : '';
const BOLD = isDevEnv ? '\x1b[1m' : '';
const BLUE = isDevEnv ? '\x1b[34m' : '';
const GREEN = isDevEnv ? '\x1b[32m' : '';
const YELLOW = isDevEnv ? '\x1b[33m' : '';
const RED = isDevEnv ? '\x1b[31m' : '';
const WHITE = isDevEnv ? '\x1b[37m' : '';
const MAGENTA = isDevEnv ? '\x1b[35m' : '';
const CYAN = isDevEnv ? '\x1b[36m' : '';

function getMethodColor(method: string) {
  switch (method.toUpperCase()) {
    case 'GET':
      return BLUE;
    case 'POST':
      return GREEN;
    case 'PUT':
      return YELLOW;
    case 'DELETE':
      return RED;
    default:
      return WHITE;
  }
}

export function logRoutes(router: Router) {
  log.info('🌐 List of routes available');
  const routeMap = new Map();

  // Collect methods for each path
  router.stack.forEach((layer) => {
    const _path = layer.opts.prefix || layer.path || '';
    const methods = layer.methods.filter((method) => method !== 'HEAD');

    if (_path && methods.length) {
      if (!routeMap.has(_path)) {
        routeMap.set(_path, new Set());
      }
      methods.forEach((method) => routeMap.get(_path).add(method));
    }
  });

  let routesCount = 0;
  let endpointCount = 0;

  // Log the routes
  routeMap.forEach((methods, path: string) => {
    routesCount += 1;
    const coloredMethods = Array.from(methods)
      .map((method) => {
        endpointCount += 1;
        const methodColor = getMethodColor(method as string);
        return `${methodColor}${method}${RESET}`;
      })
      .join(' ');

    log.info(`${BOLD}${path.replace('.js', '')}${RESET} ${coloredMethods}`);
  });

  // eslint-disable-next-line no-console
  console.log('---------------------');
  log.info(`${BOLD}${MAGENTA}${routesCount} API routes${RESET}`);
  log.info(`${BOLD}${CYAN}${endpointCount} API endpoints${RESET}`);
  // eslint-disable-next-line no-console
  console.log('---------------------');
}

export type RouterContext<T = any> = ParameterizedContext<unknown, unknown, { body: T }>;
