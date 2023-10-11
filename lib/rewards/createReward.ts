import type { BountyStatus as RewardStatus, Prisma } from '@charmverse/core/prisma';
import type { Bounty as Reward } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { NotFoundError } from 'lib/middleware';
import { getPagePath } from 'lib/pages/utils';
import { InvalidInputError, PositiveNumbersOnlyError } from 'lib/utilities/errors';

import { getRewardOrThrow } from './getReward';
import type { RewardUsersUpdate } from './setRewardUsers';

export type RewardCreationData = Pick<Reward, 'spaceId' | 'createdBy'> &
  Partial<
    Pick<
      Reward,
      'status' | 'chainId' | 'approveSubmitters' | 'maxSubmissions' | 'rewardAmount' | 'rewardToken' | 'customReward'
    >
  > & { users?: RewardUsersUpdate; linkedPageId?: string };

/**
 * You can create a reward suggestion using only title, spaceId and createdBy. You will see many unit tests using this limited dataset, which will then default the reward to suggestion status. Your logic should account for this.
 */
export async function createReward({
  spaceId,
  createdBy,
  status = 'suggestion',
  chainId = 1,
  linkedPageId,
  approveSubmitters = false,
  maxSubmissions,
  rewardAmount = 0,
  rewardToken = 'ETH',
  users,
  customReward
}: RewardCreationData) {
  const validCreationStatuses: RewardStatus[] = ['suggestion', 'open'];

  const statusIsInvalid = status && validCreationStatuses.indexOf(status) === -1;

  if (statusIsInvalid) {
    throw new InvalidInputError(
      `Rewards can only be created with one of these statuses: ${validCreationStatuses.join(', ')}`
    );
  }

  if (rewardAmount !== null) {
    if (rewardAmount === 0 && status === 'open') {
      throw new InvalidInputError('An open reward must have a reward amount assigned');
    }

    if (rewardAmount < 0) {
      throw new PositiveNumbersOnlyError();
    }
  }

  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    },
    select: {
      id: true,
      publicBountyBoard: true
    }
  });

  if (!space) {
    throw new NotFoundError(`Space with id ${spaceId} not found`);
  }

  const rewardId = v4();

  const rewardCreateInput: Prisma.BountyCreateInput = {
    id: rewardId,
    space: {
      connect: {
        id: spaceId
      }
    },
    author: {
      connect: {
        id: createdBy
      }
    },
    status,
    chainId,
    approveSubmitters,
    maxSubmissions,
    rewardAmount,
    rewardToken,
    customReward
  };

  const isSuggestion = status === 'suggestion';

  if (isSuggestion) {
    rewardCreateInput.suggestedBy = createdBy;
  }
  if (!linkedPageId) {
    await prisma.$transaction([
      prisma.bounty.create({
        data: {
          ...rewardCreateInput,
          page: {
            create: {
              id: rewardId,
              path: getPagePath(),
              title: '',
              contentText: '',
              content: undefined,
              space: {
                connect: {
                  id: spaceId
                }
              },
              updatedBy: createdBy,
              author: {
                connect: {
                  id: createdBy
                }
              },
              type: 'bounty'
            }
          }
        }
      })
    ]);
  } else {
    await prisma.$transaction([
      prisma.bounty.create({
        data: {
          ...rewardCreateInput
        }
      }),
      prisma.page.update({
        where: {
          id: linkedPageId
        },
        data: {
          type: 'card',
          bountyId: rewardId
        }
      })
    ]);
  }

  return getRewardOrThrow({ rewardId });
}
