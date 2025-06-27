import { log } from '@packages/core/log';
import type Koa from 'koa';

export async function healthCheck(ctx: Koa.Context) {
  ctx.body = 'hello world';
}

export async function errorHandler(ctx: Koa.Context, next: () => Promise<any>) {
  try {
    await next();
  } catch (err: any) {
    log.error('Service Error', { status: err.status, error: err.message, errorRaw: err });
    ctx.status = err.status || 500;
    ctx.body = err.message;
  }
}
