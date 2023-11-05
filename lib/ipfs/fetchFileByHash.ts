import { GET } from '@charmverse/core/http';

const GATEWAY_BASE_URL = 'https://cloudflare-ipfs.com/ipfs';

export function getIpfsFileUrl(hash: string) {
  return `${GATEWAY_BASE_URL}/${hash}`;
}

export function fetchFileByHash<T = unknown>(hash: string) {
  return GET<T>(getIpfsFileUrl(hash), {});
}
