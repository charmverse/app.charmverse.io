import { useTrackEvent } from '@packages/scoutgame-ui/hooks/useTrackEvent';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { useIsMounted } from './useIsMounted';

export function usePageView() {
  const trackEvent = useTrackEvent();
  const pathname = usePathname();
  const isMounted = useIsMounted();
  // use this in case we want to update on search params
  // const searchParams = useSearchParams();

  useEffect(() => {
    if (isMounted) {
      trackEvent('page_view');
    }
  }, [pathname, trackEvent, isMounted]);
}
