declare module 'koa' {
  interface Request {
    body: any;
  }
}

export interface RouterContext<RequestBody = any, ResponseBody = any> extends Koa.ParameterizedContext {
  request: Omit<Koa.Request, 'body'> & { body: RequestBody };
  body: ResponseBody;
}
