import { useEffect, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useSpaces } from 'hooks/useSpaces';

export function useCustomDomainVerification() {
  const { isFreeSpace } = useIsFreeSpace();
  const { space } = useCurrentSpace();
  const { setSpace } = useSpaces();
  const hasCustomDomain = !!space?.customDomain && !isFreeSpace;

  const [isCustomDomainVerified, setIsCustomDomainVerified] = useState(true);
  const [showCustomDomainVerification, setShowCustomDomainVerification] = useState(!space?.isCustomDomainVerified);

  const {
    data: customDomainVerification,
    mutate: refreshVerification,
    isLoading,
    isValidating: isRefreshing
  } = useSWR(
    hasCustomDomain && (!isCustomDomainVerified || showCustomDomainVerification)
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
    setShowCustomDomainVerification
  };
}
