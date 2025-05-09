import { debounce } from 'lodash';
import { useCallback, useEffect, useRef } from 'react';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { getBrowserPath } from '@packages/lib/utils/browser';

export function useAppLoadedEvent() {
  const { isLoaded } = useUser();
  const { space, isLoading: isSpaceLoading } = useCurrentSpace();

  const debouncedTrackAction = useRef(
    debounce(charmClient.track.trackAction, 2000, { leading: true, trailing: false })
  ).current;

  const trackAppLoaded = useCallback(() => {
    if (isLoaded && !isSpaceLoading) {
      debouncedTrackAction('app_loaded', {
        spaceId: space?.id,
        meta: { pathname: getBrowserPath() }
      });
    }
  }, [isLoaded, isSpaceLoading, space?.id]);

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
