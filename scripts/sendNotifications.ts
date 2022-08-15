
import { getNotifications, sendUserNotifications } from 'background/tasks/sendNotifications/sendNotifications';
import log from 'lib/log';

(async () => {
  const r = await sendUserNotifications();
  log.info('result', r);
})();
