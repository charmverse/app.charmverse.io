import { useRouter } from 'next/router';

import { useRouterTransition } from 'hooks/useRouterTransition';

export function useOnBountyCardClose() {
  const { transitionsRef } = useRouterTransition();
  const router = useRouter();

  function onClose() {
    if (!transitionsRef.current.length && router.query.bountyId) {
      const { bountyId: _, ...query } = router.query;
      router.push({ pathname: router.pathname, query }, undefined, {
        shallow: true
      });
    }
  }

  return { onClose };
}
