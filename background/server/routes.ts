import Koa from 'koa';
import log from 'lib/log';
import { gauge, count } from 'lib/metrics';

export async function healthCheck (ctx: Koa.Context) {
  ctx.body = 'hello world';
  count('healthcheck_ct', 1);
}

export async function errorHandler (ctx: Koa.Context, next: () => Promise<any>) {
  try {
    await next();
  }
  catch (err: any) {
    log.error('Service Error', { status: err.status, error: err.message, errorRaw: err });
    ctx.status = err.status || 500;
    ctx.body = err.message;
  }
}
