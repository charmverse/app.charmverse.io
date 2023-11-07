import { useCharmRouter } from 'hooks/useCharmRouter';
import { useRouterTransition } from 'hooks/useRouterTransition';

export function useOnBountyCardClose() {
  const { transitionsRef } = useRouterTransition();
  const { clearURLQuery, router } = useCharmRouter();

  function onClose() {
    if (!transitionsRef.current.length && router.query.bountyId) {
      clearURLQuery();
    }
  }

  return { onClose };
}
