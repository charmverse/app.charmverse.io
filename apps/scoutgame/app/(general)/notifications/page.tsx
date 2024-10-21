import { getNotifications } from '@packages/scoutgame/notifications/getNotifications';

import { NotificationsPage } from 'components/notifications/NotificationsPage';
import { getUserFromSession } from 'lib/session/getUserFromSession';
import { safeAwaitSSRData } from 'lib/utils/async';

export default async function Page() {
  const user = await getUserFromSession();

  const [, notifications = []] = await safeAwaitSSRData(
    getNotifications({
      userId: user?.id
    })
  );

  return <NotificationsPage notifications={notifications} />;
}
