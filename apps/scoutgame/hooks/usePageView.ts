import { useTrackEvent } from '@packages/scoutgame-ui/hooks/useTrackEvent';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function usePageView() {
  const trackEvent = useTrackEvent();
  const pathname = usePathname();
  // use this in case we want to update on search params
  // const searchParams = useSearchParams();

  useEffect(() => {
    trackEvent('page_view');
  }, [pathname, trackEvent]);
}
