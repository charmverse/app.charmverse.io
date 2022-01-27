
const _fetch = (resource: string, init?: any) => {
  const api =
    !resource.startsWith('http') && !resource.startsWith('/api')
      ? process.env.NEXT_PUBLIC_API
      : '';
  return fetch(`${api}${resource}`, init).then(transformResponse);
}

function transformResponse (response: Response) {
  if (response.status >= 400) {
    const contentType = response.headers.get('content-type') as string;
    // necessary to capture the regular response for embedded blcoks
    if (contentType?.includes('application/json')) {
      return response.json().then(json => Promise.reject(json));
    }
    // Note: 401 if user is logged out
    return response.text().then(text => Promise.reject({ status: response.status, message: text }));
  }
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return response.text()
    .then(response => {
      // since we expect JSON, dont return the true value for 200 response
      return response === 'OK' ? null : response;
    });
}

export default _fetch;
