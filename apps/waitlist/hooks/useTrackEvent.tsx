import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

import { trackEventAction } from '../lib/mixpanel/trackEventAction';
import type { WaitlistEvent, WaitlistEventMap } from '../lib/mixpanel/trackEventActionSchema';

export function useTrackEvent() {
  const { execute } = useAction(trackEventAction);

  return useCallback(
    function trackEvent<T extends WaitlistEvent = WaitlistEvent>(event: T, payload: Partial<WaitlistEventMap[T]> = {}) {
      execute({
        event,
        payload,
        currentPageTitle: document.title as string,
        currentDomain: window.location.hostname,
        currentUrlPath: window.location.pathname,
        currentUrlSearch: window.location.search
      });
    },
    [execute]
  );
}
