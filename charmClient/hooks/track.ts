import type { PageType } from '@charmverse/core/prisma-client';
import type { ViewOpPageEvent } from '@root/lib/metrics/mixpanel/opEvents';
import { useEffect } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { PageEventMap } from 'lib/metrics/mixpanel/interfaces/PageEvent';
import { getBrowserPath } from 'lib/utils/browser';

import { TrackApi } from '../apis/trackApi';

const track = new TrackApi();

export function trackPageView(page: Omit<PageEventMap['page_view'], 'userId'>) {
  const fullPath = getBrowserPath();
  const pathname = page.spaceDomain ? fullPath.replace(new RegExp(`^\\/${page.spaceDomain}`), '') : fullPath;

  track.trackAction('page_view', {
    ...page,
    meta: {
      pathname
    }
  });
}

export function trackOpPageView(page: ViewOpPageEvent) {
  track.trackActionOp('page_view', page);
}

export function useTrackPageView(page: Omit<PageEventMap['page_view'], 'spaceId' | 'userId'>) {
  const { space: currentSpace } = useCurrentSpace();
  useEffect(() => {
    if (currentSpace) {
      trackPageView({
        spaceId: currentSpace.id,
        spaceDomain: currentSpace.domain,
        spaceCustomDomain: currentSpace.customDomain,
        ...page
      });
    }
  }, [currentSpace?.id]);
}

export function useTrackOpPageView(page: Omit<ViewOpPageEvent, 'userId'>) {
  const { space: currentSpace } = useCurrentSpace();
  useEffect(() => {
    if (currentSpace?.domain !== 'op-grants') {
      track.trackActionOp('page_view', page);
    }
  }, [currentSpace?.id, page]);
}
