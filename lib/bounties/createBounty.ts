import { Bounty, BountyStatus, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { setBountyPermissions } from 'lib/permissions/bounties';
import { InvalidInputError, PositiveNumbersOnlyError } from 'lib/utilities/errors';
import { BountyCreationData } from './interfaces';

export async function createBounty ({
  title,
  spaceId,
  createdBy,
  status = 'suggestion',
  chainId = 1,
  description = '',
  descriptionNodes = '',
  linkedTaskId,
  approveSubmitters = true,
  maxSubmissions,
  rewardAmount = 0,
  rewardToken = 'ETH',
  reviewer,
  permissions
}: BountyCreationData): Promise<Bounty> {

  const validCreationStatuses: BountyStatus[] = ['suggestion', 'open'];

  const statusIsInvalid = status && validCreationStatuses.indexOf(status) === -1;

  if (statusIsInvalid) {
    throw new InvalidInputError(`Bounties can only be created with one of these statuses: ${validCreationStatuses.join(', ')}`);
  }

  if (rewardAmount === 0 && status === 'open') {
    throw new InvalidInputError('An open bounty must have a reward amount assigned');
  }

  if (rewardAmount < 0) {
    throw new PositiveNumbersOnlyError();
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
    reviewer,
    linkedTaskId
  };

  if (status === 'suggestion') {
    bountyCreateInput.suggestedBy = createdBy;
  }

  const bounty = await prisma.bounty.create({
    data: bountyCreateInput
  });

  if (permissions) {
    await setBountyPermissions({
      bountyId: bounty.id,
      permissionsToAssign: permissions
    });
  }

  return bounty;

}
