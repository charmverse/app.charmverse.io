import { prisma } from '@charmverse/core/prisma-client';
import type { BonusPartner } from '@packages/scoutgame/bonus';

export async function getBuildersForPartner({ week, bonusPartner }: { week: string; bonusPartner: BonusPartner }) {
  const events = await prisma.builderEvent.findMany({
    where: {
      githubEvent: {
        repo: {
          bonusPartner
        }
      },
      type: 'merged_pull_request',
      week
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      createdAt: true,
      builder: {
        select: {
          email: true,
          displayName: true
        }
      },
      githubEvent: {
        select: {
          createdAt: true,
          url: true,
          repo: {
            select: {
              name: true,
              owner: true
            }
          }
        }
      }
    }
  });
  return events.map((event) => ({
    'Display Name': event.builder.displayName,
    Email: event.builder.email,
    Repo: `${event.githubEvent!.repo.owner}/${event.githubEvent!.repo.name}`,
    Date: event.createdAt.toDateString(),
    Link: event.githubEvent!.url
  }));
}
