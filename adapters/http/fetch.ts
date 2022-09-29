
type RequestInit = Parameters<typeof fetch>[1];

export function transformResponse (response: Response) {
  if (response.status >= 400) {
    const contentType = response.headers.get('content-type') as string;
    // necessary to capture the regular response for embedded blocks
    if (contentType?.includes('application/json')) {
      return response.json().then((json: any) => Promise.reject({ status: response.status, ...json }));
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

export default function fetchWrapper<T> (resource: string, init?: RequestInit): Promise<T> {
  return fetch(resource, init).then(transformResponse) as Promise<T>;
}
