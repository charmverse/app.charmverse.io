import type { BountyStatus, Prisma } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { getBountyPagePermissionSet } from 'lib/bounties/shared';
import { NotFoundError } from 'lib/middleware';
import { getPagePath } from 'lib/pages/utils';
import { setBountyPermissions } from 'lib/permissions/bounties';
import { InvalidInputError, PositiveNumbersOnlyError } from 'lib/utilities/errors';

import { getBountyOrThrow } from './getBounty';
import type { BountyCreationData } from './interfaces';

/**
 * You can create a bounty suggestion using only title, spaceId and createdBy. You will see many unit tests using this limited dataset, which will then default the bounty to suggestion status. Your logic should account for this.
 */
export async function createBounty ({
  spaceId,
  createdBy,
  status = 'suggestion',
  chainId = 1,
  linkedPageId,
  approveSubmitters = true,
  maxSubmissions,
  rewardAmount = 0,
  rewardToken = 'ETH',
  permissions
}: BountyCreationData) {

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

  const bountyId = v4();

  const bountyCreateInput: Prisma.BountyCreateInput = {
    id: bountyId,
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
    rewardToken
  };

  const isSuggestion = status === 'suggestion';

  if (isSuggestion) {
    bountyCreateInput.suggestedBy = createdBy;
  }

  const bountyPagePermissionSet: Omit<Prisma.PagePermissionCreateManyInput, 'pageId'>[] = getBountyPagePermissionSet({ createdBy, status, spaceId, permissions, linkedPageId });

  const pagePermissionCreateInputs: Prisma.PagePermissionCreateManyInput[] = bountyPagePermissionSet.map(p => {
    return {
      ...p,
      pageId: bountyId
    };
  });

  // We want a smart default so that if a user creates a bounty visible to the space, and public bounty board is enabled, we inject a public permission
  if (space.publicBountyBoard && pagePermissionCreateInputs.some(p => p.spaceId)) {
    pagePermissionCreateInputs.push({
      pageId: bountyId,
      permissionLevel: 'view',
      public: true
    });
  }

  if (!linkedPageId) {
    await prisma.$transaction([
      prisma.bounty.create({
        data: {
          ...bountyCreateInput,
          page: {
            create: {
              id: bountyId,
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
      }),
      prisma.pagePermission.createMany({
        data: pagePermissionCreateInputs
      })
    ]);
  }
  else {
    await prisma.$transaction([
      prisma.bounty.create({
        data: {
          ...bountyCreateInput
        }
      }),
      prisma.page.update({
        where: {
          id: linkedPageId
        },
        data: {
          type: 'card',
          bountyId
        }
      })
      // prisma.pagePermission.createMany({
      //   data: bountyPagePermissionSet.map(p => {
      //     return {
      //       ...p,
      //       pageId: linkedPageId
      //     };
      //   })
      // })
    ]);
  }

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

  return getBountyOrThrow(bountyId);
}
