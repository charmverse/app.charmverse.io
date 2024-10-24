import fetch from './fetch';

type Params = { [key: string]: any };

export function GET<T = Response>(
  _requestUrl: string,
  data: Params = {},
  {
    headers = {},
    timeout = 30000,
    credentials = 'include'
  }: { credentials?: RequestCredentials; headers?: any; timeout?: number } = {}
): Promise<T> {
  const requestUrl = _appendQuery(_requestUrl, data);

  const controller = new AbortController();
  // Getting signal from the controller
  const signal = controller.signal;

  // Setting timeout to automatically abort after 30 seconds
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  return fetch<T>(requestUrl, {
    method: 'GET',
    headers: new Headers({
      Accept: 'application/json',
      ...headers
    }),
    signal,
    credentials
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
