import { prisma } from '@charmverse/core/prisma-client';
import type { SessionData } from '@root/lib/session/config';
import { getIronOptions } from '@root/lib/session/getIronOptions';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import webpush from 'web-push';

import { initWebPush } from 'lib/pwa/initWebPush';

export const dynamic = 'force-dynamic';

initWebPush();

export async function GET(_: Request) {
  const session = await getIronSession<SessionData>(cookies(), getIronOptions());
  const userId = session.user?.id || undefined;

  try {
    const subscriptions = await prisma.pushNotificationSubscription.findMany({
      where: {
        userId
      }
    });

    subscriptions.forEach((s) => {
      const payload = JSON.stringify({
        title: 'WebPush Notification!',
        body: 'Hello World'
      });
      webpush.sendNotification(s.subscription as any, payload);
    });

    return new Response(`${subscriptions.length} messages sent!`, { status: 200 });
  } catch (err: any) {
    return new Response(err?.message || 'Message could not be sent', {
      status: 500
    });
  }
}
