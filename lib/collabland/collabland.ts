import fetch from 'adapters/http/fetch.server';
import log from 'lib/log';

const DOMAIN = 'https://api-qa.collab.land';
const API_KEY = process.env.COLLAB_API_KEY as string;

export interface CollablandCredential {

}

export async function getCredentials ({ aeToken }: { aeToken: string }): Promise<CollablandCredential[]> {

  if (!API_KEY) {
    log.warn('No API Key provided for collab.land');
    return [];
  }

  const res = await fetch<CollablandCredential[]>(`${DOMAIN}/veramo/vcs`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-API-KEY': API_KEY,
      Authorization: `AE ${aeToken}`
    }
  });

  return res;
}
