import { prisma } from '@charmverse/core/prisma-client';

export async function getActivities() {
  const gemsReceipts = await prisma.gemsReceipt.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 10,
    select: {
      value: true,
      createdAt: true,
      type: true,
      event: {
        select: {
          githubEvent: {
            select: {
              url: true,
              repo: {
                select: {
                  name: true,
                  owner: true
                }
              }
            }
          },
          builder: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      }
    }
  });

  return gemsReceipts.map((gemsReceipt) => {
    const repoNameWithOwner = `${gemsReceipt.event.githubEvent?.repo.owner}/${gemsReceipt.event.githubEvent?.repo.name}`;
    const message =
      gemsReceipt.type === 'first_pr'
        ? 'First CONTRIBUTION'
        : gemsReceipt.type === 'regular_pr'
        ? 'Contribution ACCEPTED'
        : 'Contribution STREAK';
    return {
      avatar: gemsReceipt.event.builder.avatar,
      username: gemsReceipt.event.builder.username,
      gemsEarned: gemsReceipt.value,
      bonus: 0,
      message,
      type: 'contribution',
      detail: repoNameWithOwner,
      date: gemsReceipt.createdAt.toISOString()
    };
  });
}
