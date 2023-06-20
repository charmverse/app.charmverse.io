import { useEffect, useState } from 'react';

import { getValidCustomDomain } from 'lib/utilities/domains/getValidCustomDomain';

export function useCustomDomain() {
  const [customDomain, setIsOnCustomDomain] = useState('');

  useEffect(() => {
    const domain = getValidCustomDomain() || '';

    setIsOnCustomDomain(domain);
  }, []);

  return { isOnCustomDomain: !!customDomain, customDomain };
}
