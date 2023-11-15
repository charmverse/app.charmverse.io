import type { ParsedUrlQueryInput } from 'node:querystring';

import { useRouter } from 'next/router';

// utils for interacting with useRouter

export function useCharmRouter() {
  const router = useRouter();

  return {
    router,
    navigateToPath(pathname: string, query?: ParsedUrlQueryInput) {
      return router.push({ pathname, query });
    },
    // automatically adds the space domain prefix to the pathname
    navigateToSpacePath(pathname: string, query: ParsedUrlQueryInput = {}) {
      return router.push({
        pathname: `/[domain]${pathname}`,
        query: { ...query, domain: router.query.domain }
      });
    },
    // update the URL, trigger a digest but do not re-run SSR
    clearURLQuery() {
      const query = router.query.domain ? { domain: router.query.domain } : undefined;
      return router.push({ pathname: router.pathname, query }, undefined, {
        shallow: true
      });
    },
    // update the URL, trigger a digest but do not re-run SSR
    updateURLQuery(query: ParsedUrlQueryInput) {
      // filter empty query params
      const updatedQuery = Object.fromEntries(
        Object.entries({ ...router.query, ...query }).filter(([_, v]) => v != null)
      );

      return router.push({ pathname: router.pathname, query: updatedQuery }, undefined, {
        shallow: true
      });
    }
  };
}
