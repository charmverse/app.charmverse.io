import { prisma } from '@charmverse/core/prisma-client';
import { getLastWeek } from '@packages/scoutgame/dates';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

export async function GET() {
  const lastWeek = getLastWeek();
  const events = await prisma.builderEvent.findMany({
    where: {
      githubEvent: {
        repo: {
          bonusPartner: 'celo'
        }
      },
      type: 'merged_pull_request',
      week: lastWeek
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      createdAt: true,
      builder: {
        select: {
          email: true,
          username: true
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
  const rows = events.map((event) => ({
    'Farcaster Name': event.builder.username,
    Email: event.builder.email,
    Repo: `${event.githubEvent!.repo.owner}/${event.githubEvent!.repo.name}`,
    Date: event.createdAt.toDateString(),
    Link: event.githubEvent!.url
  }));

  return respondWithTSV(rows, 'scout_users_export.tsv');
}
