import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

import { trackEventAction } from '../lib/mixpanel/trackEventAction';
import type { EventType } from '../lib/mixpanel/trackEventActionSchema';

export function useTrackEvent() {
  const { execute } = useAction(trackEventAction);

  return useCallback(
    function trackEvent(event: EventType) {
      execute({
        event,
        currentPageTitle: document.title,
        currentDomain: window.location.hostname,
        currentUrlPath: window.location.pathname,
        currentUrlSearch: window.location.search
      });
    },
    [execute]
  );
}
