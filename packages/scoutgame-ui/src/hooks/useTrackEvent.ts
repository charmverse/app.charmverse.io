import type { MixpanelEventName } from '@packages/mixpanel/interfaces';
import { trackEventAction } from '@packages/scoutgame/mixpanel/trackEventAction';
import { useAction } from 'next-safe-action/hooks';
import { useCallback } from 'react';

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
