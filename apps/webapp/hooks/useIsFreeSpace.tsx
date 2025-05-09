import { useCurrentSpace } from './useCurrentSpace';

type SpaceSubscriptionMeta = {
  isFreeSpace: boolean;
};

export function useIsFreeSpace(): SpaceSubscriptionMeta {
  const { space } = useCurrentSpace();

  return { isFreeSpace: space?.paidTier === 'free' };
}
