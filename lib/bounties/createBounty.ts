import { BountyStatus, PageType, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { getBountyPagePermissionSet } from 'lib/bounties/shared';
import { setBountyPermissions } from 'lib/permissions/bounties';
import { InvalidInputError, PositiveNumbersOnlyError } from 'lib/utilities/errors';
import { BountyWithDetails } from 'models';
import { v4 } from 'uuid';
import { getBounty } from './getBounty';
import { BountyCreationData } from './interfaces';

/**
 * You can create a bounty suggestion using only title, spaceId and createdBy. You will see many unit tests using this limited dataset, which will then default the bounty to suggestion status. Your logic should account for this.
 */
export async function createBounty ({
  spaceId,
  createdBy,
  status = 'suggestion',
  chainId = 1,
  description = '',
  descriptionNodes = '',
  linkedPageId,
  approveSubmitters = true,
  maxSubmissions,
  rewardAmount = 0,
  rewardToken = 'ETH',
  permissions,
  title = ''
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

  const bountyId = v4();

  const bountyCreateInput: Prisma.BountyCreateInput = {
    id: bountyId,
    title: '',
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
    description: '',
    descriptionNodes: '',
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

  if (!linkedPageId) {
    await prisma.$transaction([
      prisma.bounty.create({
        data: {
          ...bountyCreateInput,
          page: {
            create: {
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
            }
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
      }),
      prisma.pagePermission.createMany({
        data: bountyPagePermissionSet.map(p => {
          return {
            ...p,
            pageId: linkedPageId
          };
        })
      })
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

  return getBounty(bountyId) as Promise<BountyWithDetails>;
}
