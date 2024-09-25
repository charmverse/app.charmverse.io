import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { PrismaClient, ScoutGameActivityType } from '@charmverse/core/prisma-client';
import type { ScoutGameActivity, Prisma } from '@charmverse/core/prisma-client';

const prisma = new PrismaClient();

const commonActivityKeys = ['userId', 'amount', 'type', 'pointsDirection'] as const;

type CommonActivityKeys = (typeof commonActivityKeys)[number];

type RelatedEvent = Partial<
  Pick<
    ScoutGameActivity,
    | 'builderStrikeId'
    | 'nftPurchaseEventId'
    | 'gemsPayoutEventId'
    | 'pointsReceiptId'
    | 'onchainTxHash'
    | 'onchainChainId'
  >
>;

export type ActivityToRecord = {
  sourceEvent: RelatedEvent;
  activity: Omit<Required<Pick<ScoutGameActivity, CommonActivityKeys>>, 'type'> & { createdAt?: Date };
};

export async function recordGameActivity({ activity, sourceEvent }: ActivityToRecord) {
  const totalEvents = Object.keys(sourceEvent).length;

  if (totalEvents === 0) {
    throw new InvalidInputError('At least one source event must be provided');
  }

  if (totalEvents > 1 && !(sourceEvent.onchainTxHash && sourceEvent.onchainChainId)) {
    throw new InvalidInputError('Only one relation must be added');
  }

  if (sourceEvent.onchainTxHash && !sourceEvent.onchainChainId) {
    throw new InvalidInputError('onchainChainId is required when onchainTxHash is provided');
  }

  if (sourceEvent.onchainChainId && !sourceEvent.onchainTxHash) {
    throw new InvalidInputError('onchainTxHash is required when onchainChainId is provided');
  }

  if (!activity.userId) {
    throw new InvalidInputError('User id is required');
  }

  // Now generate the parsing of scoutgameactviitt event type enum value
  // Parse the ScoutGameActivityType enum value
  let parsedType: ScoutGameActivityType;

  if (sourceEvent.builderStrikeId !== undefined) {
    parsedType = ScoutGameActivityType.strike;
  } else if (sourceEvent.nftPurchaseEventId !== undefined) {
    parsedType = ScoutGameActivityType.builder_registered;
  } else if (sourceEvent.gemsPayoutEventId !== undefined) {
    parsedType = ScoutGameActivityType.gems;
  } else if (sourceEvent.pointsReceiptId !== undefined) {
    parsedType = ScoutGameActivityType.points;
  } else if (sourceEvent.onchainTxHash !== undefined && sourceEvent.onchainChainId !== undefined) {
    parsedType = ScoutGameActivityType.mint;
  } else {
    throw new InvalidInputError(`Invalid ScoutGameActivityType: Unable to determine type from source event`);
  }

  // Validate the pointsDirection
  if (activity.pointsDirection !== 'in' && activity.pointsDirection !== 'out') {
    throw new InvalidInputError(`Invalid pointsDirection: ${activity.pointsDirection}`);
  }

  const commonWhere: Prisma.ScoutGameActivityWhereInput = {
    // Common props we always need
    userId: activity.userId,
    amount: activity.amount,
    pointsDirection: activity.pointsDirection,
    type: parsedType,
    // Join
    ...sourceEvent
  };

  const existingActivity = await prisma.scoutGameActivity.findFirst({ where: commonWhere });

  if (existingActivity) {
    log.warn(`Tried to log duplicate activity`, { activity });
    return existingActivity;
  }

  return prisma.scoutGameActivity.create({
    data: {
      type: parsedType,
      pointsDirection: activity.pointsDirection,
      amount: activity.amount,
      createdAt: activity.createdAt,
      user: {
        connect: {
          id: activity.userId
        }
      },
      builderStrike: sourceEvent.builderStrikeId ? { connect: { id: sourceEvent.builderStrikeId } } : undefined,
      nftPurchaseEvent: sourceEvent.nftPurchaseEventId
        ? { connect: { id: sourceEvent.nftPurchaseEventId } }
        : undefined,
      gemsPayoutEvent: sourceEvent.gemsPayoutEventId ? { connect: { id: sourceEvent.gemsPayoutEventId } } : undefined,
      pointsReceipt: sourceEvent.pointsReceiptId ? { connect: { id: sourceEvent.pointsReceiptId } } : undefined,
      onchainTxHash: sourceEvent.onchainTxHash,
      onchainChainId: sourceEvent.onchainChainId
    }
  });
}
