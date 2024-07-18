import { prisma } from '@charmverse/core/prisma-client';
import webpush from 'web-push';

import { initWebPush } from 'lib/pwa/initWebPush';
import { getSession } from 'lib/session/getSession';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');
  const body = searchParams.get('body');

  initWebPush();
  const session = await getSession();
  const userId = session.user?.id || undefined;

  try {
    const subscriptions = await prisma.pushNotificationSubscription.findMany({
      where: {
        userId
      }
    });

    subscriptions.forEach((s) => {
      const payload = JSON.stringify({
        title: title || 'WebPush Notification!',
        body: body || 'Hello World'
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
