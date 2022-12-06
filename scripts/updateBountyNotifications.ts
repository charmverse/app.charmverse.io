import { BountyTask, getBountyTasks } from 'lib/bounties/getBountyTasks';
import { prisma } from '../db';

const getBountyWithUserId = async ({id}: { id: string}) => {
  const bounty = await getBountyTasks(id);

  // Attach the userId so we know who to assign the unmarked bounties
  const unmarkedBountiesWithUserId: (BountyTask & { userId: string })[] = bounty.unmarked.map(b => ({...b, userId: id}))

  return unmarkedBountiesWithUserId;
}


/**
 * Script for taking all unmarked bounties for all the users and creating user notifications.
 */
(async () => {
  const users = await prisma.user.findMany({
    where: {
      AND: [
        { email: { not: null } },
        { email: { not: '' } }
      ]
    },
    select: { id: true}
  });

  const unmarkedBounties = await Promise.all(users.map(getBountyWithUserId))
  const bounties = unmarkedBounties.flat();
  await prisma.userNotification.createMany({
    data: bounties.map(bounty => ({
      userId: bounty.userId,
      taskId: bounty.id,
      channel: 'email',
      type: 'bounty'
    })),
    skipDuplicates: true,
  })

  console.log(`Created notifications for ${bounties.length} unmarked bounties`)
})();
