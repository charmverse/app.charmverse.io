import type { SWRConfiguration } from 'swr';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import useSWRMutation from 'swr/mutation';

import * as http from 'adapters/http';

export type MaybeString = string | null | undefined;

// eslint-disable-next-line default-param-last
export function useGET<T = unknown>(path: MaybeString, query: any = {}, swrOptions?: SWRConfiguration) {
  const requestUrl = path ? path + getQueryString(query) : null;
  return useSWR<T>(requestUrl, http.GET, swrOptions);
}

// eslint-disable-next-line default-param-last
export function useGETImmutable<T = unknown>(path: MaybeString, query: any = {}, swrOptions?: SWRConfiguration) {
  const requestUrl = path ? path + getQueryString(query) : null;
  return useSWRImmutable<T>(requestUrl, http.GET, swrOptions);
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

// To be used when you need to trigger a get request on demand
export function useGETtrigger<T, U = unknown>(path: MaybeString) {
  return useSWRMutation<U, Error, string, T>(path || '', (url: string, { arg }: { arg: any }) => {
    const requestUrl = url + getQueryString(arg);
    return http.GET<U>(requestUrl);
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
