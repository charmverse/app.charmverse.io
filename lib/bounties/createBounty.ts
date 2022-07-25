import { Bounty, BountyStatus, PageType, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { setBountyPermissions } from 'lib/permissions/bounties';
import { InvalidInputError, PositiveNumbersOnlyError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';
import { BountyWithDetails } from 'models';
import { v4 } from 'uuid';
import { getBounty } from './getBounty';
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
}: BountyCreationData): Promise<BountyWithDetails> {

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
    rewardToken
  };

  const isSuggestion = status === 'suggestion';

  if (isSuggestion) {
    bountyCreateInput.suggestedBy = createdBy;
  }

  const pageData: Prisma.PageCreateInput = {
    id: bountyId,
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
    type: 'bounty'
  };

  const bountyPagePermissionSet: Omit<Prisma.PagePermissionCreateManyInput, 'pageId'>[] = [];

  bountyPagePermissionSet.push({
    permissionLevel: 'full_access',
    userId: createdBy
  });

  // Initialise page permissions
  if (status === 'suggestion') {
    bountyPagePermissionSet.push({
      permissionLevel: 'view',
      spaceId
    });
  }
  else {
    // Reviewer permissions
    permissions?.reviewer?.forEach(reviewer => {
      if (reviewer.group === 'role') {
        bountyPagePermissionSet.push({
          permissionLevel: 'view_comment',
          roleId: reviewer.id
        });
      }
      // Prevent adding a duplicate user permission for the creator
      else if (reviewer.group === 'user' && bountyPagePermissionSet.every(p => p.userId !== reviewer.id)) {
        bountyPagePermissionSet.push({
          permissionLevel: 'view_comment',
          userId: reviewer.id
        });
      }
    });

    // Submitter permissions
    permissions?.submitter?.forEach(submitter => {
      // Prevent adding a duplicate role permission
      if (submitter.group === 'role' && bountyPagePermissionSet.every(p => p.roleId !== submitter.id)) {
        bountyPagePermissionSet.push({
          permissionLevel: 'view',
          roleId: submitter.id
        });
      }
      // Prevent adding a duplicate space permission
      else if (submitter.group === 'space' && bountyPagePermissionSet.every(p => !isTruthy(p.spaceId))) {
        bountyPagePermissionSet.push({
          permissionLevel: 'view',
          spaceId
        });
      }
    });
  }

  await prisma.$transaction([
    prisma.bounty.create({
      data: {
        ...bountyCreateInput,
        page: {
          create: pageData
        }
      }
    }),
    prisma.pagePermission.createMany({
      data: bountyPagePermissionSet.map(p => {
        return {
          ...p,
          pageId: bountyId
        };
      })
    })
  ]);

  // Initialise suggestions with a view permission
  if (isSuggestion) {
    await setBountyPermissions({
      bountyId,
      permissionsToAssign: {
        creator: [{
          group: 'user',
          id: createdBy
        }]
      }
    });
  }
  // Pass custom permissions
  else if (permissions) {
    await setBountyPermissions({
      bountyId,
      permissionsToAssign: permissions
    });
  }

  return getBounty(bountyId) as Promise<BountyWithDetails>;

}
