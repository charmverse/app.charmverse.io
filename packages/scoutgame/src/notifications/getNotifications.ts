import { InvalidInputError } from '@charmverse/core/errors';
import { ActivityRecipientType, prisma, ScoutGameActivityType } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { isTruthy } from '@packages/utils/types';

import { getSeasonWeekFromISOWeek } from '../dates';

type ScoutGameNotificationCommonProps = {
  id: string;
  createdAt: Date;
  userId: string;
  amount?: number;
  bonus?: string;
  recipientType: ActivityRecipientType;
  type: ScoutGameActivityType;
};

type GemsNotificationType = 'gems_first_pr' | 'gems_third_pr_in_streak' | 'gems_regular_pr';

type BuilderRecipientGemsNotification = ScoutGameNotificationCommonProps & {
  type: GemsNotificationType;
  repo: string;
  pullRequestNumber: number;
  recipientType: 'builder';
};

type ScoutRecipientGemsNotification = ScoutGameNotificationCommonProps & {
  type: GemsNotificationType;
  recipientType: 'scout';
  builderUsername: string;
};

type NftPurchaseNotification = ScoutGameNotificationCommonProps & {
  type: 'nft_purchase';
  recipientType: 'builder';
  scoutUsername: string;
  tokensPurchased: number;
  pointsValue: number;
};

type PointsReceiptNotification = ScoutGameNotificationCommonProps & {
  type: 'points';
  recipientType: ActivityRecipientType;
  title: string;
  season: number;
  week: number;
  claimable: boolean;
};

type StrikeNotificationType = 'builder_strike' | 'builder_suspended';

type BuilderRecipientStrikeNotification = ScoutGameNotificationCommonProps & {
  type: StrikeNotificationType;
  recipientType: 'builder';
  repo: string;
  pullRequestNumber: number;
  strikeCount: number;
};

type ScoutRecipientStrikeNotification = ScoutGameNotificationCommonProps & {
  type: StrikeNotificationType;
  recipientType: 'scout';
  builderUsername: string;
  strikeCount: number;
};

export type ScoutGameNotification =
  | BuilderRecipientGemsNotification
  | ScoutRecipientGemsNotification
  | NftPurchaseNotification
  | PointsReceiptNotification
  | BuilderRecipientStrikeNotification
  | ScoutRecipientStrikeNotification;

export async function getNotifications({ userId }: { userId: string }): Promise<ScoutGameNotification[]> {
  if (!stringUtils.isUUID(userId)) {
    throw new InvalidInputError(`userId required for notifications`);
  }

  const activities = await prisma.scoutGameActivity.findMany({
    where: {
      userId
    },
    select: {
      id: true,
      createdAt: true,
      type: true,
      userId: true,
      recipientType: true,
      gemsReceipt: {
        select: {
          id: true,
          value: true,
          event: {
            select: {
              bonusPartner: true,
              githubEvent: {
                select: {
                  pullRequestNumber: true,
                  repo: {
                    select: {
                      owner: true,
                      name: true
                    }
                  }
                }
              },
              builder: {
                select: {
                  username: true
                }
              }
            }
          }
        }
      },
      nftPurchaseEvent: {
        select: {
          id: true,
          scout: {
            select: {
              username: true
            }
          },
          tokensPurchased: true,
          pointsValue: true
        }
      },
      builderStrike: {
        select: {
          createdAt: true,
          id: true,
          builder: {
            select: {
              username: true
            }
          },
          githubEvent: {
            select: {
              pullRequestNumber: true,
              repo: {
                select: {
                  owner: true,
                  name: true
                }
              }
            }
          }
        }
      },
      pointsReceipt: {
        select: {
          id: true,
          claimedAt: true,
          value: true,
          event: {
            select: {
              type: true,
              description: true,
              season: true,
              week: true
            }
          }
        }
      },
      gemsReceiptId: true,
      pointsReceiptId: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const strikeDates = activities
    .map((activity) => activity.builderStrike?.createdAt)
    .filter(isTruthy)
    .sort((a, b) => a.getTime() - b.getTime());

  return activities
    .map((activity) => {
      const commonProps: ScoutGameNotificationCommonProps = {
        id: activity.id,
        createdAt: activity.createdAt,
        userId: activity.userId,
        type: activity.type,
        recipientType: activity.recipientType
      };

      switch (activity.type) {
        case ScoutGameActivityType.builder_strike:
        case ScoutGameActivityType.builder_suspended: {
          if (activity.recipientType === ActivityRecipientType.builder) {
            const strike = activity.builderStrike;
            if (!strike) {
              return null;
            }
            const githubEvent = strike.githubEvent;
            if (!githubEvent) {
              return null;
            }
            return {
              ...commonProps,
              repo: `${githubEvent.repo.owner}/${githubEvent.repo.name}`,
              pullRequestNumber: githubEvent.pullRequestNumber,
              strikeCount: strikeDates.indexOf(strike.createdAt) + 1
            } as BuilderRecipientStrikeNotification;
          } else if (activity.recipientType === ActivityRecipientType.scout) {
            const strike = activity.builderStrike;
            if (!strike) {
              return null;
            }
            const builder = strike.builder;
            if (!builder) {
              return null;
            }
            return {
              ...commonProps,
              builderUsername: builder.username,
              strikeCount: strikeDates.indexOf(strike.createdAt) + 1
            } as ScoutRecipientStrikeNotification;
          }
          break;
        }

        case ScoutGameActivityType.gems_first_pr:
        case ScoutGameActivityType.gems_third_pr_in_streak:
        case ScoutGameActivityType.gems_regular_pr: {
          const receipt = activity.gemsReceipt;
          if (!receipt) {
            return null;
          }
          if (activity.recipientType === ActivityRecipientType.builder) {
            const githubEvent = receipt.event.githubEvent;
            if (!githubEvent) {
              return null;
            }
            return {
              ...commonProps,
              amount: receipt.value,
              repo: `${githubEvent.repo.owner}/${githubEvent.repo.name}`,
              pullRequestNumber: githubEvent.pullRequestNumber,
              bonus: receipt.event.bonusPartner
            } as BuilderRecipientGemsNotification;
          } else if (activity.recipientType === ActivityRecipientType.scout) {
            const builder = receipt.event.builder;
            if (!builder) {
              return null;
            }
            return {
              ...commonProps,
              amount: receipt.value,
              bonus: receipt.event.bonusPartner,
              builderUsername: builder.username
            } as ScoutRecipientGemsNotification;
          }
          break;
        }

        case ScoutGameActivityType.nft_purchase: {
          const receipt = activity.nftPurchaseEvent;
          if (!receipt) {
            return null;
          }
          return {
            ...commonProps,
            scoutUsername: receipt.scout.username,
            tokensPurchased: receipt.tokensPurchased,
            pointsValue: receipt.pointsValue
          } as NftPurchaseNotification;
        }

        case ScoutGameActivityType.points: {
          const receipt = activity.pointsReceipt;
          if (!receipt) {
            return null;
          }
          const title =
            receipt.event.type === 'gems_payout'
              ? `Congratulations! Your season ${receipt.event.season} week ${receipt.event.week} reward are ready!`
              : receipt.event.description;
          if (!title) {
            return null;
          }
          return {
            ...commonProps,
            amount: receipt.value,
            season: 1,
            title,
            claimable: receipt.claimedAt === null,
            week: getSeasonWeekFromISOWeek({
              season: receipt.event.season,
              week: receipt.event.week
            })
          } as PointsReceiptNotification;
        }

        default: {
          return null;
        }
      }

      return null;
    })
    .filter(isTruthy);
}
