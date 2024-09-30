import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { PrismaClient, ScoutGameActivityType } from '@charmverse/core/prisma-client';
import type { ScoutGameActivity, Prisma, OptionalPrismaTransaction } from '@charmverse/core/prisma-client';

const prisma = new PrismaClient();

const commonActivityKeys = ['userId', 'amount', 'type', 'pointsDirection'] as const;

type CommonActivityKeys = (typeof commonActivityKeys)[number];

type RelatedEvent = Partial<
  Pick<
    ScoutGameActivity,
    | 'builderStrikeId'
    | 'nftPurchaseEventId'
    | 'gemsReceiptId'
    | 'gemsPayoutEventId'
    | 'pointsReceiptId'
    | 'onchainTxHash'
    | 'onchainChainId'
    | 'registeredBuilderNftId'
  >
>;

export type ActivityToRecord = {
  sourceEvent: RelatedEvent;
  activity: Omit<Required<Pick<ScoutGameActivity, CommonActivityKeys>>, 'type'> & { createdAt?: Date };
};

function activityTypeFromEvent(sourceEvent: RelatedEvent): ScoutGameActivityType {
  let parsedType: ScoutGameActivityType;

  if (sourceEvent.builderStrikeId !== undefined) {
    parsedType = ScoutGameActivityType.strike;
  } else if (sourceEvent.nftPurchaseEventId !== undefined) {
    parsedType = ScoutGameActivityType.mint;
  } else if (sourceEvent.gemsPayoutEventId !== undefined) {
    parsedType = ScoutGameActivityType.gems;
  } else if (sourceEvent.pointsReceiptId !== undefined) {
    parsedType = ScoutGameActivityType.points;
  } else if (sourceEvent.gemsReceiptId !== undefined) {
    parsedType = ScoutGameActivityType.gems_from_pr;
  } else if (sourceEvent.registeredBuilderNftId !== undefined) {
    parsedType = ScoutGameActivityType.builder_registered;
  } else if (sourceEvent.onchainTxHash !== undefined && sourceEvent.onchainChainId !== undefined) {
    parsedType = ScoutGameActivityType.mint;
  } else {
    throw new InvalidInputError(`Invalid ScoutGameActivityType: Unable to determine type from source event`);
  }

  return parsedType;
}

export async function recordGameActivity({
  activity,
  sourceEvent,
  tx = prisma
}: ActivityToRecord & OptionalPrismaTransaction) {
  const totalEvents = Object.keys(sourceEvent).length;

  if (totalEvents === 0) {
    throw new InvalidInputError('At least one source event must be provided');
  }

  const hasValidOnchainRef = sourceEvent.onchainTxHash && sourceEvent.onchainChainId;

  // We can link to any of 1 database event, plus an optional onchain ref
  if ((totalEvents >= 2 && !hasValidOnchainRef) || (totalEvents > 3 && hasValidOnchainRef)) {
    throw new InvalidInputError('Only one relation must be added, along with an optional onchain reference');
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
  const parsedType = activityTypeFromEvent(sourceEvent);

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

  const existingActivity = await tx.scoutGameActivity.findFirst({ where: commonWhere });

  if (existingActivity) {
    log.warn(`Tried to log duplicate activity`, { activity });
    return existingActivity;
  }

  return tx.scoutGameActivity.create({
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

      // Events we track
      builderStrike: sourceEvent.builderStrikeId ? { connect: { id: sourceEvent.builderStrikeId } } : undefined,
      nftPurchaseEvent: sourceEvent.nftPurchaseEventId
        ? { connect: { id: sourceEvent.nftPurchaseEventId } }
        : undefined,
      registeredBuilderNft: sourceEvent.registeredBuilderNftId
        ? { connect: { id: sourceEvent.registeredBuilderNftId } }
        : undefined,
      gemsReceipt: sourceEvent.gemsReceiptId ? { connect: { id: sourceEvent.gemsReceiptId } } : undefined,
      gemsPayoutEvent: sourceEvent.gemsPayoutEventId ? { connect: { id: sourceEvent.gemsPayoutEventId } } : undefined,
      pointsReceipt: sourceEvent.pointsReceiptId ? { connect: { id: sourceEvent.pointsReceiptId } } : undefined,
      // Optional onchain reference
      onchainTxHash: sourceEvent.onchainTxHash,
      onchainChainId: sourceEvent.onchainChainId
    }
  });
}
export async function recordGameActivityWithCatchError(activity: ActivityToRecord): Promise<void> {
  try {
    await recordGameActivity(activity);
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      log.error(`Error saving activity for ${activity.activity.userId}`, { error, activity });
    }
  }
}
