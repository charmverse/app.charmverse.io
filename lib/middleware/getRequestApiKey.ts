type Request =
  | {
      query: { api_key?: string };
    }
  | {
      headers: { authorization?: string };
    }
  | {
      headers: { Authorization?: string };
    };

export function getRequestApiKey(req: Request) {
  if ('query' in req && req.query.api_key) {
    return req.query.api_key;
  }

  if ('headers' in req) {
    const apiKeyHeader = Object.entries(req.headers).find(([header]) => header.toLowerCase() === 'authorization');
    if (apiKeyHeader) {
      return apiKeyHeader[1].split('Bearer').join('').trim();
    }
  }

  return null;
}
