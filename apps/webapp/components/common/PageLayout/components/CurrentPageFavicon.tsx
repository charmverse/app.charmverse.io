import { useEffect, useState } from 'react';

import { usePageFromPath } from 'hooks/usePageFromPath';

import Favicon from './Favicon';

export function CurrentPageFaviconBrowserComponent() {
  const currentPage = usePageFromPath();
  return <Favicon pageIcon={currentPage?.icon} />;
}

// wrap the component so that it is not run until it is mounted
export function CurrentPageFavicon() {
  const [isComponentMounted, setIsComponentMounted] = useState(false);

  useEffect(() => setIsComponentMounted(true), []);

  if (!isComponentMounted) {
    return null;
  }

  return <CurrentPageFaviconBrowserComponent />;
}
