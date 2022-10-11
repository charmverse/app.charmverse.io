import { prisma } from 'db';
import type { PageEventNames } from 'lib/metrics/mixpanel/interfaces/PageEvents';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { wait } from 'lib/utilities/wait';

export async function trackPageAction (
  eventName: PageEventNames,
  { userId, pageId, delay = 0, withName }: { userId: string, pageId: string, delay?: number, withName?: boolean }
) {
  // Delay if we user is supposed to update the page meanwhile
  if (delay) {
    await wait(delay);
  }

  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (page) {
    const payload: { userId: string, resourceId: string, spaceId: string, pageName?: string } = { userId, resourceId: pageId, spaceId: page.spaceId };

    if (withName) {
      payload.pageName = page.title;
    }

    trackUserAction(eventName, payload);
  }
}
