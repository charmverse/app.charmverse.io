import { Response as NodeFetchResponse } from 'node-fetch';

type RequestInit = Parameters<typeof fetch>[1];

export function transformResponse (response: Response | NodeFetchResponse) {
  if (response.status >= 400) {
    const contentType = response.headers.get('content-type') as string;
    // necessary to capture the regular response for embedded blcoks
    if (contentType?.includes('application/json')) {
      return response.json().then(json => Promise.reject({ status: response.status, ...json }));
    }
    // Note: 401 if user is logged out
    return response.text().then(text => Promise.reject({ status: response.status, message: text }));
  }
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return response.text()
    .then(_response => {
      // since we expect JSON, dont return the true value for 200 response
      return _response === 'OK' ? null : _response;
    });
}

export default function fetchWrapper (resource: string, init?: RequestInit) {
  return fetch(resource, init).then(transformResponse);
}
