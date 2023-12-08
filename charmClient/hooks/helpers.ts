import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import useSWRMutation from 'swr/mutation';

import * as http from 'adapters/http';

export type MaybeString = string | null | undefined;

export function useGET<T = unknown>(path: string | undefined | null, query: any = {}) {
  const requestUrl = path ? path + getQueryString(query) : null;
  return useSWR<T>(requestUrl, http.GET);
}

export function useGETImmutable<T = unknown>(path: string | undefined | null, query: any = {}) {
  const requestUrl = path ? path + getQueryString(query) : null;
  return useSWRImmutable<T>(requestUrl, http.GET);
}

export function useDELETE<T>(path: string) {
  return useSWRMutation<unknown, Error, string, T>(path, (url: string, { arg }: { arg: any }) => {
    return http.DELETE(url, arg);
  });
}

export function usePOST<T, U = unknown>(path: string) {
  return useSWRMutation<U, Error, string, T>(path, (url: string, { arg }: { arg: any }) => {
    return http.POST<U>(url, arg);
  });
}

export function usePUT<T, U = unknown>(path: string) {
  return useSWRMutation<U, Error, string, T>(path, (url: string, { arg }: { arg: any }) => {
    return http.PUT<U>(url, arg);
  });
}

function getQueryString(query: any = {}) {
  // map optional query inputs into the url
  const queryStr = Object.keys(query)
    .filter((key) => !!query[key])
    .map((key) => `${key}=${encodeURIComponent(query[key])}`)
    .join('&');
  return queryStr ? `?${queryStr}` : '';
}
