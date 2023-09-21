import { debounce } from 'lodash';
import { useCallback, useEffect, useRef } from 'react';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { getBrowserPath } from 'lib/utilities/browser';

export function useAppLoadedEvent() {
  const { isLoaded } = useUser();
  const { space } = useCurrentSpace();

  const debouncedTrackAction = useRef(debounce(charmClient.track.trackAction, 2000)).current;

  const trackAppLoaded = useCallback(() => {
    if (isLoaded) {
      debouncedTrackAction('app_loaded', {
        spaceId: space?.id,
        meta: { pathname: getBrowserPath() }
      });
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
