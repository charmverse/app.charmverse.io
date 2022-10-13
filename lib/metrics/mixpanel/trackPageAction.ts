import { prisma } from 'db';
import type { PageEventNames } from 'lib/metrics/mixpanel/interfaces/PageEvents';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';

export async function trackPageAction (eventName: PageEventNames, { userId, pageId }: { userId: string, pageId: string }) {
  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (page) {
    trackUserAction(eventName, { userId, pageId, spaceId: page.spaceId });
  }
}
