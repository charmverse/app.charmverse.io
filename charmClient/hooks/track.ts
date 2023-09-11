import { useEffect } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { PageEventMap } from 'lib/metrics/mixpanel/interfaces/PageEvent';

import { TrackApi } from '../apis/trackApi';

const track = new TrackApi();

export function useTrackPageView(page: Omit<PageEventMap['page_view'], 'spaceId' | 'userId'>) {
  const { space: currentSpace } = useCurrentSpace();
  useEffect(() => {
    if (currentSpace) {
      track.trackAction('page_view', { spaceId: currentSpace.id, ...page });
    }
  }, [currentSpace?.id]);
}
