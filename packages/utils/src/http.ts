import fetch from './fetch';

type Params = { [key: string]: any };

type HttpConfig = {
  credentials?: RequestCredentials;
  headers?: any;
  addBracketsToArrayValues?: boolean;
  timeout?: number;
};

type ParamsOrHttpConfig = Params | HttpConfig;

const httpConfigParams: (keyof HttpConfig)[] = ['credentials', 'headers', 'addBracketsToArrayValues', 'timeout'];

export function GET<T = Response>(_requestUrl: string, params?: ParamsOrHttpConfig, config?: HttpConfig): Promise<T> {
  // allow passing config as second or 3rd argument
  if (_isConfigObject(params)) {
    config = params;
    params = {};
  }
  const requestUrl = _appendQuery(_requestUrl, params || {});

  const controller = new AbortController();
  // Getting signal from the controller
  const signal = controller.signal;

  // Setting timeout to automatically abort after 30 seconds
  const timeoutId = setTimeout(() => controller.abort(), config?.timeout || 30000);

  return fetch<T>(requestUrl, {
    method: 'GET',
    headers: new Headers({
      Accept: 'application/json',
      ...config?.headers
    }),
    signal,
    credentials: config?.credentials
  }).then((response) => {
    clearTimeout(timeoutId);
    return response;
  });
}

export function DELETE<T>(
  _requestUrl: string,
  data: Params = {},
  { headers = {} }: { headers?: any } = {}
): Promise<T> {
  const requestUrl = _appendQuery(_requestUrl, data);
  return fetch<T>(requestUrl, {
    method: 'DELETE',
    headers: new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers
    }),
    credentials: 'include'
  });
}

export function POST<T>(
  requestURL: string,
  data: Params | string = {},
  {
    headers = {},
    noHeaders,
    skipStringifying,
    credentials = 'include',
    query
  }: {
    credentials?: RequestCredentials;
    headers?: any;
    noHeaders?: boolean;
    skipStringifying?: boolean;
    query?: any;
  } = {}
): Promise<T> {
  const urlWithQuery = query ? _appendQuery(requestURL, query || {}) : requestURL;

  return fetch<T>(urlWithQuery, {
    body: !skipStringifying ? JSON.stringify(data) : (data as string),
    method: 'POST',
    headers: noHeaders
      ? undefined
      : new Headers({
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...headers
        }),
    credentials
  });
}

export function PUT<T>(requestURL: string, data: Params = {}, { headers = {} }: { headers?: any } = {}): Promise<T> {
  return fetch<T>(requestURL, {
    body: JSON.stringify(data),
    method: 'PUT',
    headers: new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers
    }),
    credentials: 'include'
  });
}

function _appendQuery(path: string, data: Params) {
  const queryString = Object.keys(data)
    .filter((key) => !!data[key])
    .map((key) => {
      const value = data[key];
      return Array.isArray(value)
        ? `${value.map((v: string) => `${key}=${v}`).join('&')}`
        : `${key}=${encodeURIComponent(value)}`;
    })
    .join('&');
  return `${path}${queryString ? `?${queryString}` : ''}`;
}

function _isConfigObject(obj: ParamsOrHttpConfig | undefined): obj is HttpConfig {
  if (!obj || typeof obj === 'string') {
    return false;
  }

  return Object.keys.length > 0 && Object.keys(obj).every((key) => httpConfigParams.includes(key as keyof HttpConfig));
}
