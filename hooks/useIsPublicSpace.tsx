import { useCurrentSpace } from './useCurrentSpace';

type SpaceSubscriptionMeta = {
  isPublicSpace: boolean;
};

export function useIsPublicSpace(): SpaceSubscriptionMeta {
  const space = useCurrentSpace();

  return { isPublicSpace: space?.paidTier === 'free' };
}
