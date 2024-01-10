type RequestInit = Parameters<typeof fetch>[1];

export async function transformResponse(response: Response) {
  const contentType = response.headers.get('content-type');

  if (response.status >= 400) {
    // necessary to capture the regular response for embedded blocks
    if (contentType?.includes('application/json')) {
      try {
        const jsonResponse = await response.json();
        return Promise.reject({ status: response.status, ...jsonResponse });
      } catch (error) {
        // not valid JSON, content-type is lying!
      }
    }
    // Note: 401 if user is logged out
    return response.text().then((text) => Promise.reject({ status: response.status, message: text }));
  }

  if (contentType?.includes('application/json')) {
    return response.json();
  } else if (contentType?.includes('application/octet-stream')) {
    return response.blob();
  }
  return response.text().then((_response) => {
    // since we expect JSON, dont return the true value for 200 response
    return _response === 'OK' ? null : _response;
  });
}

export default function fetchWrapper<T>(resource: string, init?: RequestInit): Promise<T> {
  return fetch(resource, init).then(transformResponse) as Promise<T>;
}
