import * as http from '@packages/adapters/http';
import type { SWRConfiguration } from 'swr';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import useSWRMutation from 'swr/mutation';

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

export function usePUT<T, U = unknown>(path: string, options?: { revalidate?: boolean }) {
  return useSWRMutation<U, Error, string, T>(
    path,
    (url: string, { arg }: { arg: any }) => {
      return http.PUT<U>(url, arg);
    },
    options
  );
}

// To be used when you need to trigger a get request on demand
export function useGETtrigger<T, U = unknown>(path: MaybeString) {
  return useSWRMutation<U, Error, string, T>(path || '', (url: string, { arg }: { arg: any }) => {
    const requestUrl = url + getQueryString(arg);
    return http.GET<U>(requestUrl);
  });
}

type Params = { [key: string]: string | string[] | undefined };

function getQueryString(params: Params = {}) {
  const queryString = Object.keys(params)
    .filter((key) => !!params[key])
    .map((key) => {
      const value = params[key] || '';
      return Array.isArray(value)
        ? `${value.map((v: string) => `${key}[]=${encodeURIComponent(v)}`).join('&')}`
        : `${key}=${encodeURIComponent(value)}`;
    })
    .join('&');
  return queryString ? `?${queryString}` : '';
}
