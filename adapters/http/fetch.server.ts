import fetch, { RequestInit } from 'node-fetch';
import { transformResponse } from './fetch';

export default function fetchWrapper<T> (resource: string, init?: RequestInit): Promise<T> {
  return fetch(resource, init).then(transformResponse);
}
