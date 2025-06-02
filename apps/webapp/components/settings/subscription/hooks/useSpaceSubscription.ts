import { getBlockQuotaLimit, hasExceededBlockQuota } from '@packages/subscriptions/featureRestrictions';

import { useBlockCount } from 'components/settings/subscription/hooks/useBlockCount';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

export function useSpaceSubscription() {
  const { space: currentSpace } = useCurrentSpace();
  const { count } = useBlockCount();

  const isSpaceReadonly = currentSpace?.subscriptionTier === 'readonly';

  const spaceBlockQuota = getBlockQuotaLimit(currentSpace?.subscriptionTier);
  const hasPassedBlockQuota = hasExceededBlockQuota(currentSpace?.subscriptionTier || null, count || 0);

  return {
    isSpaceReadonly,
    hasPassedBlockQuota,
    spaceBlockQuota,
    spaceBlockCount: count,
    paidTier: currentSpace?.paidTier,
    subscriptionTier: currentSpace?.subscriptionTier
  };
}
