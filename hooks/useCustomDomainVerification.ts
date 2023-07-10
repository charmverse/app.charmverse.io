import { useEffect, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';

export function useCustomDomainVerification() {
  const { isFreeSpace } = useIsFreeSpace();
  const { space } = useCurrentSpace();
  const hasCustomDomain = !!space?.customDomain && !isFreeSpace;

  const [isCustomDomainVerified, setIsCustomDomainVerified] = useState(true);
  const [showCustomDomainVerification, setShowCustomDomainVerification] = useState(false);

  const {
    data: customDomainVerification,
    mutate: refresh,
    isLoading
  } = useSWR(
    hasCustomDomain && (!isCustomDomainVerified || showCustomDomainVerification)
      ? `${space.customDomain}/custom-domain-verification`
      : null,
    () => charmClient.spaces.verifyCustomDomain(space!.id)
  );

  useEffect(() => {
    if (hasCustomDomain) {
      setIsCustomDomainVerified(!!space.isCustomDomainVerified);
      setShowCustomDomainVerification(!space.isCustomDomainVerified);
    }
  }, [space?.isCustomDomainVerified, hasCustomDomain]);

  return {
    isCustomDomainVerified,
    customDomainVerification,
    refresh,
    isLoading: !isCustomDomainVerified && isLoading,
    showCustomDomainVerification,
    setShowCustomDomainVerification
  };
}
