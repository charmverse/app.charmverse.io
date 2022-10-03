
import { transformResponse } from './fetch';

export default function fetchWrapper<T> (url: RequestInfo, init?: RequestInit): Promise<T> {
  return fetch(url, init).then(transformResponse) as Promise<T>;
}
