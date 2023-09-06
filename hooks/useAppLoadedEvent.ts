import { useCallback, useEffect } from 'react';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';

export function useAppLoadedEvent() {
  const { isLoaded } = useUser();
  const { space } = useCurrentSpace();

  const trackAppLoaded = useCallback(() => {
    if (isLoaded) {
      charmClient.track.trackAction('app_loaded', { spaceId: space?.id });
    }
  }, [isLoaded, space?.id]);

  useEffect(() => {
    trackAppLoaded();
  }, [trackAppLoaded]);

  useEffect(() => {
    window.addEventListener('focus', trackAppLoaded);

    return () => {
      window.removeEventListener('focus', trackAppLoaded);
    };
  }, [trackAppLoaded]);
}
