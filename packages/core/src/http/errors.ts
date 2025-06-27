import type { FetchLibrary, RequestInitWithRetry } from 'fetch-retry';

import { SystemError } from '../errors';

type HTTPMeta = {
  message?: string;
  method: RequestInitWithRetry<FetchLibrary>['method'];
  requestBody?: any;
  requestUrl: string;
  responseCode: number | string;
  response?: any;
};

export class HTTPFetchError extends SystemError {
  requestBody: HTTPMeta['requestBody'];

  requestUrl: HTTPMeta['requestUrl'];

  responseCode: HTTPMeta['responseCode'];

  response: HTTPMeta['response'];

  constructor(meta: HTTPMeta) {
    const severity = typeof meta.responseCode === 'string' || meta.responseCode >= 500 ? 'error' : 'warning';
    const message = meta.message || `HTTP Error ${meta.method} ${meta.responseCode}: ${meta.requestUrl}`;
    super({
      message,
      severity,
      errorType: 'External service'
    });
    this.requestBody = meta.requestBody;
    this.requestUrl = meta.requestUrl;
    this.responseCode = meta.responseCode;
  }
}
