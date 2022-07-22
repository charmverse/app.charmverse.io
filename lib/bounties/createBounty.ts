import { Bounty, BountyStatus, PageType, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { setBountyPermissions } from 'lib/permissions/bounties';
import { InvalidInputError, PositiveNumbersOnlyError } from 'lib/utilities/errors';
import { v4 } from 'uuid';
import { BountyCreationData } from './interfaces';

/**
 * You can create a bounty suggestion using only title, spaceId and createdBy. You will see many unit tests using this limited dataset, which will then default the bounty to suggestion status. Your logic should account for this.
 */
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

  const bountyId = v4();

  const bountyCreateInput: Prisma.BountyCreateInput = {
    id: bountyId,
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
    linkedTaskId
  };

  const isSuggestion = status === 'suggestion';

  if (isSuggestion) {
    bountyCreateInput.suggestedBy = createdBy;
  }

  let pageData = {};

  pageData = {
    create: {
      path: `page-${Math.random().toString().replace('0.', '')}`,
      title,
      contentText: description,
      content: descriptionNodes as string,
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
      type: PageType.bounty
    }
  };

  const bounty = await prisma.bounty.create({
    data: {
      ...bountyCreateInput,
      page: pageData
    }
  });

  // Initialise suggestions with a view permission
  if (isSuggestion) {
    await setBountyPermissions({
      bountyId: bounty.id,
      permissionsToAssign: {
        creator: [{
          group: 'user',
          id: createdBy
        }],
        // This permission is created so that all space members can see the suggestion. When the admin is configuring a not yet approved suggestion, this will remain the same, or be overriden if the admin has restricted submitters to a list of roles.
        submitter: [{
          group: 'space',
          id: spaceId
        }]
      }
    });
  }
  // Pass custom permissions
  else if (permissions) {
    await setBountyPermissions({
      bountyId: bounty.id,
      permissionsToAssign: permissions
    });
  }

  return bounty;

}
