import { prisma } from 'db';
import type { BountyWithDetails } from 'lib/bounties';
import { DataNotFoundError, InvalidInputError, PositiveNumbersOnlyError } from 'lib/utilities/errors';

import { countValidSubmissions } from '../applications/shared';
import { setBountyPermissions } from '../permissions/bounties';

import { getBountyOrThrow } from './getBounty';
import type { BountyUpdate } from './interfaces';

export async function updateBountySettings ({
  bountyId,
  updateContent
}: BountyUpdate): Promise<BountyWithDetails> {

  if (updateContent.rewardAmount === null || (typeof updateContent.rewardAmount === 'number' && updateContent.rewardAmount <= 0)) {
    throw new PositiveNumbersOnlyError();
  }

  const bounty = await getBountyOrThrow(bountyId);

  if (typeof updateContent.maxSubmissions === 'number' && bounty.maxSubmissions !== null && updateContent.maxSubmissions < countValidSubmissions(bounty.applications)) {
    throw new InvalidInputError('New bounty cap cannot be lower than total of active and valid submissions.');
  }
  const [updatedBounty] = await prisma.$transaction([
    prisma.bounty.update({
      where: {
        id: bountyId
      },
      data: {
        updatedAt: new Date(),
        chainId: updateContent.chainId,
        rewardAmount: updateContent.rewardAmount,
        rewardToken: updateContent.rewardToken,
        approveSubmitters: updateContent.approveSubmitters,
        maxSubmissions: updateContent.maxSubmissions
      }
    })
  ]);

  if (!updatedBounty) {
    throw new DataNotFoundError(`Bounty with ID ${bountyId} not found`);
  }

  if (updateContent.permissions) {
    await setBountyPermissions({
      bountyId,
      permissionsToAssign: updateContent.permissions
    });
  }

  return getBountyOrThrow(bountyId);
}
