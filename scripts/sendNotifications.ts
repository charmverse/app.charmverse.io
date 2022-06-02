
import { sendUserNotifications } from 'background/tasks/sendNotifications/sendNotifications';

(async () => {
  await sendUserNotifications();
})();
