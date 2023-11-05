import { useEffect, useState } from 'react';

import { getCustomDomainFromHost } from 'lib/utilities/domains/getCustomDomainFromHost';

export function useCustomDomain() {
  const [customDomain, setIsOnCustomDomain] = useState('');

  useEffect(() => {
    const domain = getCustomDomainFromHost() || '';

    setIsOnCustomDomain(domain);
  }, []);

  return { isOnCustomDomain: !!customDomain, customDomain };
}
