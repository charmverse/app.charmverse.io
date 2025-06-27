export abstract class AbstractPermissionsApiClient {
  readonly getRequestBatchSize = 1000;

  get jsonHeaders(): HeadersInit {
    const headers = new Headers({});
    headers.append('Content-Type', 'application/json');
    return headers;
  }
}
