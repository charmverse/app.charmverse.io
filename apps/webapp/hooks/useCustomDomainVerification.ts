import { hasCustomDomainAccess } from '@packages/lib/subscription/constants';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useSpaces } from 'hooks/useSpaces';

export function useCustomDomainVerification() {
  const { isFreeSpace } = useIsFreeSpace();
  const { space } = useCurrentSpace();
  const { setSpace } = useSpaces();
  const isAdmin = useIsAdmin();
  const hasAccess = hasCustomDomainAccess(space?.subscriptionTier);

  // Only consider custom domain if space has access to it
  const hasCustomDomain = !!space?.customDomain && !isFreeSpace && hasAccess;

  const [isCustomDomainVerified, setIsCustomDomainVerified] = useState(true);
  const [showCustomDomainVerification, setShowCustomDomainVerification] = useState(!space?.isCustomDomainVerified);

  const {
    data: customDomainVerification,
    mutate: refreshVerification,
    isLoading,
    isValidating: isRefreshing
  } = useSWR(
    isAdmin && hasCustomDomain && (!isCustomDomainVerified || showCustomDomainVerification)
      ? `${space.customDomain}/custom-domain-verification`
      : null,
    () => charmClient.spaces.verifyCustomDomain(space!.id)
  );

  useEffect(() => {
    if (hasCustomDomain) {
      setIsCustomDomainVerified(!!space.isCustomDomainVerified);
    }
  }, [space?.isCustomDomainVerified, hasCustomDomain]);

  useEffect(() => {
    if (customDomainVerification) {
      setIsCustomDomainVerified(!!customDomainVerification.isCustomDomainVerified);

      if (space && customDomainVerification.isCustomDomainVerified !== space.isCustomDomainVerified) {
        setSpace({ ...space, isCustomDomainVerified: customDomainVerification.isCustomDomainVerified });
      }
    }
  }, [customDomainVerification, setSpace, space]);

  return {
    isCustomDomainVerified,
    customDomainVerification,
    refreshVerification,
    isLoading,
    isRefreshing,
    showCustomDomainVerification,
    setShowCustomDomainVerification,
    hasAccess
  };
}
