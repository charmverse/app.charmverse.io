import { Bounty, BountyStatus, Prisma } from '@prisma/client';
import { InvalidInputError, UnauthorisedActionError } from 'lib/utilities/errors';
import { prisma } from 'db';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { BountyCreationData } from './interfaces';

export async function createBounty ({
  title,
  spaceId,
  createdBy,
  status = 'suggestion',
  chainId = 1,
  description = '',
  descriptionNodes = '',
  approveSubmitters = true,
  maxSubmissions,
  rewardAmount = 0,
  rewardToken = 'ETH',
  expiryDate,
  reviewer
}: BountyCreationData): Promise<Bounty> {

  const validCreationStatuses: BountyStatus[] = ['suggestion', 'open'];

  const statusIsInvalid = status && validCreationStatuses.indexOf(status) === -1;

  if (statusIsInvalid) {
    throw new InvalidInputError(`Bounties can only be created with one of these statuses: ${validCreationStatuses.join(', ')}`);
  }

  if (rewardAmount === 0 && status === 'open') {
    throw new InvalidInputError('An open bounty must have a reward amount assigned');
  }

  const { error, isAdmin } = await hasAccessToSpace({
    userId: createdBy,
    spaceId,
    adminOnly: false
  });

  if (error) {
    throw (error);
  }

  if (status === 'open' && isAdmin === false) {
    throw new UnauthorisedActionError('Only administrators can create open status bounties');
  }

  const bountyCreateInput: Prisma.BountyCreateInput = {
    title,
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
    description,
    descriptionNodes: descriptionNodes as string,
    approveSubmitters,
    maxSubmissions,
    rewardAmount,
    rewardToken,
    expiryDate,
    reviewer

  };

  if (status === 'suggestion') {
    bountyCreateInput.suggestedBy = createdBy;
  }

  return prisma.bounty.create({
    data: bountyCreateInput
  });

}
