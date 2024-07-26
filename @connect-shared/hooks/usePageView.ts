import { getBrowserPath } from '@root/lib/utils/browser';
import { useAction } from 'next-safe-action/hooks';
import { useEffect } from 'react';

import { trackEventAction } from '../lib/mixpanel/trackEventAction';

export function usePageView() {
  const { execute } = useAction(trackEventAction);

  useEffect(() => {
    const fullPath = getBrowserPath();
    execute({
      event: 'page_view',
      path: window.location.pathname,
      url: window.location.href,
      meta: {
        pathname: fullPath
      }
    });
  }, [execute]);
}
