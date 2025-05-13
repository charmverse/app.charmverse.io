import { useRouter } from 'next/router';
import { useEffect } from 'react';

import charmClient from 'charmClient';
import { useNotifications } from 'components/nexus/hooks/useNotifications';
import { setUrlWithoutRerender } from '@packages/lib/utils/browser';

export function useMarkNotificationFromUrl() {
  const router = useRouter();
  const { mutate: refreshNotifications } = useNotifications();

  useEffect(() => {
    async function main() {
      const notificationId = router.query.notificationId as string | undefined;
      if (notificationId) {
        await charmClient.notifications.markNotifications({
          ids: [notificationId],
          state: 'read'
        });
        refreshNotifications();
        setUrlWithoutRerender(router.pathname, { notificationId: null });
      }
    }

    main();
  }, [router.query.notificationId, router.pathname, refreshNotifications]);
}
