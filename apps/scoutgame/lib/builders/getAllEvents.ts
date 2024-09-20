import type { GemsReceiptType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type BuilderEventRow = {
  avatar: string | null;
  username: string;
  gemsEarned: number;
  bonus: number;
  message: string;
  type: 'contribution' | 'grant' | 'scout';
  detail: string;
  date: string;
};

const receiptTypeMessage: Record<GemsReceiptType, string> = {
  first_pr: 'First CONTRIBUTION',
  regular_pr: 'Contribution ACCEPTED',
  third_pr_in_streak: 'Contribution STREAK'
};

export async function getAllEvents(): Promise<BuilderEventRow[]> {
  const builderEvents = await prisma.builderEvent.findMany({
    where: {
      gemsReceipt: {
        isNot: null
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10,
    select: {
      createdAt: true,
      gemsReceipt: {
        select: {
          value: true,
          type: true
        }
      },
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
  });

  return builderEvents.map((event) => {
    const { gemsReceipt, githubEvent } = event;
    const repoNameWithOwner = `${githubEvent?.repo.owner}/${githubEvent?.repo.name}`;
    const message = receiptTypeMessage[gemsReceipt?.type as GemsReceiptType] || 'Contribution';
    return {
      avatar: event.builder.avatar,
      username: event.builder.username,
      gemsEarned: gemsReceipt?.value || 0,
      bonus: 0,
      message,
      type: 'contribution',
      detail: repoNameWithOwner,
      date: event.createdAt.toISOString()
    };
  });
}
