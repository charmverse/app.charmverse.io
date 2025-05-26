import { useRouter } from 'next/router';
import { useMemo } from 'react';

// utils for interacting with useRouter

export function useCharmRouter() {
  const router = useRouter();

  return useMemo(
    () => ({
      router,
      // automatically adds the space domain prefix to the pathname
      navigateToSpacePath(pathname: string, query: Record<string, string | null> = {}) {
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
      updateURLQuery(query: Record<string, string | null>) {
        // filter empty query params
        const updatedQuery = Object.fromEntries(
          Object.entries({ ...router.query, ...query }).filter(([_, v]) => v != null)
        );

        return router.push({ pathname: router.pathname, query: updatedQuery }, undefined, {
          shallow: true
        });
      }
    }),
    [router]
  );
}
