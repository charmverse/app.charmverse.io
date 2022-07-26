
import nock from 'nock';

import fetch, { RequestInit } from 'node-fetch';
import { transformResponse } from './fetch';

nock.disableNetConnect();

export default function fetchWrapper<T> (resource: string, init?: RequestInit): Promise<T> {
  return fetch(resource, init).then(transformResponse);
}
