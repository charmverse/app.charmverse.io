import { useEffect, useState } from 'react';

import { getValidCustomDomain } from 'lib/utilities/domains/getValidCustomDomain';

export function useCustomDomain() {
  const [isOnCustomDomain, setIsOnCustomDomain] = useState(false);

  useEffect(() => {
    const customDomain = getValidCustomDomain();
    if (customDomain) {
      setIsOnCustomDomain(true);
    }
  }, []);

  return { isOnCustomDomain };
}
