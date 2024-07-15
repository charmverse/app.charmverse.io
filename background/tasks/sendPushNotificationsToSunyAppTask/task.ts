import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { initWebPush } from 'apps/sunnyawards/lib/pwa/initWebPush';
import webpush from 'web-push';

import { count } from 'lib/metrics';

initWebPush();

export async function task() {
  log.debug('Running Push Notification cron job for Sunny Awards app');

  try {
    const subscriptions = await prisma.pushNotificationSubscription.findMany({});

    subscriptions.forEach((s) => {
      const payload = JSON.stringify({
        title: 'Charm Connect Notification',
        body: 'Hello World'
      });
      webpush.sendNotification(s.subscription as any, payload);
    });
    count('cron.sunny-push-notifications.removed-member-roles', subscriptions.length);
  } catch (error: any) {
    log.error(`Error while sending push notifications to the Sunny Awards`, { error });
  }
}
