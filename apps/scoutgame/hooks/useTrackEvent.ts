import type { MixpanelEventName } from '@packages/mixpanel/interfaces';
import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

import { trackEventAction } from 'lib/mixpanel/trackEventAction';

export function useTrackEvent() {
  const { execute } = useAction(trackEventAction);

  return useCallback(
    function trackEvent(event: MixpanelEventName, properties?: Record<string, string | number>) {
      execute({
        event,
        currentPageTitle: document.title,
        currentDomain: window.location.hostname,
        currentUrlPath: window.location.pathname,
        currentUrlSearch: window.location.search,
        ...properties
      });
    },
    [execute]
  );
}
