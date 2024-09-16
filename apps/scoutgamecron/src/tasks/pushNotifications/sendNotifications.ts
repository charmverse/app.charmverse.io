import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
// import { count } from '@root/lib/metrics';
import webpush from 'web-push';

import { initWebPush } from './initWebPush';

initWebPush();

export async function sendNotifications() {
  log.debug('Running Push Notification cron job for Connect app');

  try {
    const subscriptions = await prisma.pushNotificationSubscription.findMany({});

    subscriptions.forEach((s) => {
      const payload = JSON.stringify({
        title: 'Charm Connect Notification',
        body: 'Hello World'
      });
      webpush.sendNotification(s.subscription as any, payload);
    });
    // count('cron.connect-push-notifications.subscriptions', subscriptions.length);
  } catch (error: any) {
    log.error(`Error while sending push notifications to the Connect app`, { error });
  }
}
