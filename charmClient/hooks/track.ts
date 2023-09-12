import { useEffect } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { PageEventMap } from 'lib/metrics/mixpanel/interfaces/PageEvent';

import { TrackApi } from '../apis/trackApi';

const track = new TrackApi();

export function trackPageView(page: Omit<PageEventMap['page_view'], 'userId'>) {
  track.trackAction('page_view', {
    ...page,
    meta: {
      pathname: window.location.pathname
    }
  });
}

export function useTrackPageView(page: Omit<PageEventMap['page_view'], 'spaceId' | 'userId'>) {
  const { space: currentSpace } = useCurrentSpace();
  useEffect(() => {
    if (currentSpace) {
      trackPageView({
        spaceId: currentSpace.id,
        ...page
      });
    }
  }, [currentSpace?.id]);
}
