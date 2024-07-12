import { prisma } from '@charmverse/core/prisma-client';
import { initWebPush } from '@connect/lib/pwa/initWebPush';
import { NextResponse, type NextRequest } from 'next/server';
import webpush from 'web-push';

initWebPush();

export async function GET(_: NextRequest) {
  try {
    const subscriptions = await prisma.serviceWorkerSubscriptions.findMany({
      where: {
        deletedAt: null
      }
    });

    subscriptions.forEach((s) => {
      const payload = JSON.stringify({
        title: 'WebPush Notification!',
        body: 'Hello World'
      });
      webpush.sendNotification(s.subscription as any, payload);
    });

    return NextResponse.json({
      message: `${subscriptions.length} messages sent!`
    });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      message: err?.message
    });
  }
}
