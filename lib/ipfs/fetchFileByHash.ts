import fetch from 'adapters/http/fetch.server';

const GATEWAY_BASE_URL = 'https://cloudflare-ipfs.com/ipfs';

export function fetchFileByHash<T = unknown>(hash: string) {
  const url = `${GATEWAY_BASE_URL}/${hash}`;

  return fetch<T>(url);
}
