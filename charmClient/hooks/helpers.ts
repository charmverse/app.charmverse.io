import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import * as http from 'adapters/http';

export function useGET<T = unknown>(path: string | undefined | null, query: any = {}) {
  // map optional query inputs into the url
  const queryStr = Object.keys(query)
    .filter((key) => !!query[key])
    .map((key) => `${key}=${encodeURIComponent(query[key])}`)
    .join('&');
  const requestUrl = path ? path + (queryStr ? `?${queryStr}` : '') : null;
  return useSWR<T>(requestUrl, http.GET);
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
