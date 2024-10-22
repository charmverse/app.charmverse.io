import { getSession } from '@connect-shared/lib/session/getSession';
import { getNotifications } from '@packages/scoutgame/notifications/getNotifications';

import { NotificationsPage } from 'components/notifications/NotificationsPage';
import { safeAwaitSSRData } from 'lib/utils/async';

export default async function Page() {
  const { scoutId } = await getSession();

  const [, notifications = []] = await safeAwaitSSRData(
    getNotifications({
      userId: scoutId
    })
  );

  return <NotificationsPage notifications={notifications} />;
}
