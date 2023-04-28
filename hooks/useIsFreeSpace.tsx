import { useCurrentSpace } from './useCurrentSpace';

type SpaceSubscriptionMeta = {
  isPublicMode: boolean;
};

export function useIsFreeSpace(): SpaceSubscriptionMeta {
  const space = useCurrentSpace();

  return { isPublicMode: space?.paidTier === 'free' };
}
