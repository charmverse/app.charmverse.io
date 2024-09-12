import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { useTrackEvent } from './useTrackEvent';

export function usePageView() {
  const trigger = useTrackEvent();
  const pathname = usePathname();
  // use this in case we want to update on search params
  // const searchParams = useSearchParams();

  useEffect(() => {
    trigger('page_view', { page: pathname });
  }, [pathname, trigger]);
}
