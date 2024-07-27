import { usePathname } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useEffect } from 'react';

import { trackEventAction } from '../lib/mixpanel/trackEventAction';

export function usePageView() {
  const { execute } = useAction(trackEventAction);
  const pathname = usePathname();
  // use this in case we want to update on search params
  // const searchParams = useSearchParams();

  useEffect(() => {
    execute({
      event: 'page_view',
      current_page_title: document.title,
      current_domain: window.location.hostname,
      current_url_path: window.location.pathname,
      current_url_search: window.location.search
    });
  }, [pathname, execute]);
}
