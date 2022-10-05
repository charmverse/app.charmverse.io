import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/server';
import type { PageDetails } from 'lib/pages';

export async function trackPageView (userId: string, pageDetails: PageDetails) {
  const space = await prisma.space.findUnique({ where: { id: pageDetails.spaceId } });
  if (space) {
    trackUserAction('page_load', { userId, resourceId: pageDetails.id, spaceId: space.id, spaceName: space.name });
  }
}
