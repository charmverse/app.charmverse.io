import { Prisma, prisma } from '@charmverse/core/prisma-client';

export async function uncheckProposalPublishedNotification() {
  const spacesWithNotificationToggles = await prisma.space.findMany({
    select: {
      id: true,
      notificationToggles: true
    }
  });

  let count = 0;
  const total = spacesWithNotificationToggles.length;

  for (const spaceWithNotificationToggles of spacesWithNotificationToggles) {
    try {
      await prisma.space.update({
        where: {
          id: spaceWithNotificationToggles.id
        },
        data: {
          notificationToggles: {
            ...(spaceWithNotificationToggles.notificationToggles as Prisma.JsonObject),
            proposals__proposal_published: false
          }
        }
      });
    } catch (err) {
      console.error('Error in space:', spaceWithNotificationToggles.id, {
        err
      });
    } finally {
      count++;
      console.log('Processed', count, 'out of', total);
    }
  }
}

uncheckProposalPublishedNotification();
