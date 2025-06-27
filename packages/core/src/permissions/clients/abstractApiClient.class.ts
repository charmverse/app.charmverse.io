import type { PermissionsApiClientConstructor } from './interfaces';

export abstract class AbstractPermissionsApiClient {
  readonly baseUrl: string;

  readonly authKey: string;

  readonly getRequestBatchSize = 1000;

  get jsonHeaders(): HeadersInit {
    const headers = new Headers({});
    headers.append('Content-Type', 'application/json');
    return headers;
  }

  constructor({ baseUrl, authKey }: PermissionsApiClientConstructor) {
    this.baseUrl = baseUrl;
    this.authKey = authKey;
  }
}
