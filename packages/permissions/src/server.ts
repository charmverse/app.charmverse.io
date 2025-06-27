// @ts-nocheck

import type { SystemError } from '@packages/core/errors';
import { log } from '@packages/core/log';
import { stringUtils } from '@packages/core/utilities';
import Koa from 'koa';
import bodyparser from 'koa-bodyparser';
import logger from 'koa-logger';
import Router from 'koa-router';
import { forumPermissionsRouter } from 'routes/forum';
import { pagePermissionsRouter } from 'routes/pages';
import { proposalPermissionsRouter } from 'routes/proposals';
import { spacePermissionsRouter } from 'routes/spaces';

const baseapp = new Koa();

export function isQueryValueTrue<T = any>({ query, key }: { query: T; key: keyof T }) {
  return query[key] === 'true' || query[key] === true;
}

function extractUuidValue({ ctx, key }: { ctx: Koa.Context; key: string }): string | null {
  try {
    const bodyValue = ctx.request.body?.[key];
    const queryValue = ctx.request.query?.[key];
    if (stringUtils.isUUID(bodyValue)) {
      return bodyValue;
    } else if (stringUtils.isUUID(queryValue as string)) {
      return queryValue as string;
    }
  } catch (err) {
    // Do nothing, we don't want the error handler to blow up
  }
  return null;
}

async function apiErrorHandler(ctx: Koa.Context, next: Koa.Next) {
  try {
    await next();
  } catch (error) {
    const errorCode = (error as SystemError).code;

    const statusCode = typeof errorCode === 'number' && errorCode >= 100 && errorCode <= 599 ? errorCode : 500;
    ctx.status = statusCode;
    ctx.response.body = error;

    const logMethod = ctx.status < 500 ? log.warn : log.error;

    const logMetaData = {
      error,
      body: ctx.request.body,
      method: ctx.request.method,
      status: ctx.status,
      url: ctx.request.originalUrl,
      resourceId: extractUuidValue({ ctx, key: 'resourceId' }),
      userId: extractUuidValue({ ctx, key: 'userId' }),
      spaceId: extractUuidValue({ ctx, key: 'spaceId' }),
      pageId: extractUuidValue({ ctx, key: 'pageId' })
    };

    logMethod(`Request failed: ${error.message || error}`, logMetaData);
  }
}

baseapp.use(
  logger((str) => {
    if (process.env.NODE_ENV === 'development') {
      log.debug(str);
    }
  })
);

baseapp.use(apiErrorHandler);

baseapp.use(bodyparser({ enableTypes: ['json', 'text'] }));

const baseRoute = new Router();

baseRoute.get('/', async (ctx) => {
  ctx.response.status = 200;
});

baseRoute.get('/api/health', async (ctx) => {
  ctx.response.body = {
    message: 'OK'
  };
  ctx.response.status = 200;
});

baseapp.use(baseRoute.routes());
baseapp.use(forumPermissionsRouter.routes());
baseapp.use(proposalPermissionsRouter.routes());
baseapp.use(pagePermissionsRouter.routes());
baseapp.use(spacePermissionsRouter.routes());
export const app = baseapp;
