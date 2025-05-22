import { hasCustomDomainAccess } from '@packages/lib/subscription/constants';
import { getCustomDomainFromHost } from '@packages/lib/utils/domains/getCustomDomainFromHost';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';

export function useCustomDomain() {
  const [customDomain, setCustomDomain] = useState('');
  const router = useRouter();
  const { space } = useCurrentSpace();

  useEffect(() => {
    const domain = getCustomDomainFromHost() || '';
    setCustomDomain(domain);

    // If we're on a custom domain and the space doesn't have access to custom domains
    if (domain && space && !hasCustomDomainAccess(space.subscriptionTier)) {
      const spaceDomain = space.domain;
      const redirectUrl = `https://app.charmverse.io/${spaceDomain}`;

      // Redirect to the space domain
      window.location.href = redirectUrl;
    }
  }, [space, router.asPath]);

  return { isOnCustomDomain: !!customDomain, customDomain };
}
