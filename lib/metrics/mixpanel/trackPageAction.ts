import { prisma } from 'db';
import type { PageEventNames } from 'lib/metrics/mixpanel/interfaces/PageEvents';
import { trackUserAction } from 'lib/metrics/mixpanel/server';

export async function trackPageAction (eventName: PageEventNames, userId: string, pageId: string) {
  const page = await prisma.page.findUnique({ where: { id: pageId }, include: { space: true } });
  if (page && page.space) {
    trackUserAction(eventName, { userId, resourceId: pageId, spaceId: page.space.id, spaceName: page.space.name });
  }
}
