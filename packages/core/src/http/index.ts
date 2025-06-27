import fetch from './fetch';

type Params = { [key: string]: any };

type HttpConfig = { credentials?: RequestCredentials; headers?: any; addBracketsToArrayValues?: boolean };

const httpConfigParams: (keyof HttpConfig)[] = ['credentials', 'headers', 'addBracketsToArrayValues'];

type ParamsOrHttpConfig = Params | null | undefined | HttpConfig;

export function GET<T = Response>(_requestUrl: string, params?: ParamsOrHttpConfig, config?: HttpConfig): Promise<T> {
  // allow passing config as second or 3rd argument
  if (_isConfigObject(params)) {
    config = params;
    params = {};
  }
  const credentials = config?.credentials || 'include';
  const headers = config?.headers || {};
  const addBracketsToArrayValues = config?.addBracketsToArrayValues ?? true;

  const requestUrl = _appendQuery(_requestUrl, params || {}, addBracketsToArrayValues);

  return fetch<T>(requestUrl, {
    method: 'GET',
    headers: new Headers({
      Accept: 'application/json',
      ...headers
    }),
    credentials
  });
}

export function DELETE<T>(_requestUrl: string, params: Params = {}, config: { headers?: any } = {}): Promise<T> {
  // allow passing config as second or 3rd argument
  if (_isConfigObject(params)) {
    config = params;
    params = {};
  }
  const requestUrl = _appendQuery(_requestUrl, params);
  return fetch<T>(requestUrl, {
    // deprecated: sending DELETE params inside of body
    body: JSON.stringify(params),
    method: 'DELETE',
    headers: new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...config.headers
    }),
    credentials: 'include'
  });
}

export function POST<T>(
  requestURL: string,
  data: Params | string = {},
  { headers = {}, noHeaders, skipStringifying }: { headers?: any; noHeaders?: boolean; skipStringifying?: boolean } = {}
): Promise<T> {
  return fetch<T>(requestURL, {
    body: !skipStringifying ? JSON.stringify(data) : (data as string),
    method: 'POST',
    headers: noHeaders
      ? undefined
      : new Headers({
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...headers
        }),
    credentials: 'include'
  });
}

export function PUT<T>(requestURL: string, params: Params = {}, { headers = {} }: { headers?: any } = {}): Promise<T> {
  return fetch<T>(requestURL, {
    body: JSON.stringify(params),
    method: 'PUT',
    headers: new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers
    }),
    credentials: 'include'
  });
}

function _appendQuery(path: string, params: Params, addBracketsToArrayValues: boolean = true) {
  const queryString = Object.keys(params)
    .filter((key) => !!params[key])
    .map((key) => {
      const value = params[key];
      return Array.isArray(value)
        ? `${value.map((v: string) => `${key}${addBracketsToArrayValues ? '[]' : ''}=${v}`).join('&')}`
        : `${key}=${encodeURIComponent(value)}`;
    })
    .join('&');
  return `${path}${queryString ? `?${queryString}` : ''}`;
}

function _isConfigObject(obj: ParamsOrHttpConfig): obj is HttpConfig {
  if (!obj || typeof obj === 'string') {
    return false;
  }

  return Object.keys(obj).every((key) => httpConfigParams.includes(key as keyof HttpConfig));
}
