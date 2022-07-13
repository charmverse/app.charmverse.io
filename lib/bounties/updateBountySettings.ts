import { Bounty } from '@prisma/client';
import { prisma } from 'db';
import { DataNotFoundError, InvalidInputError, PositiveNumbersOnlyError } from 'lib/utilities/errors';
import { countValidSubmissions } from '../applications/shared';
import { setBountyPermissions } from '../permissions/bounties';
import { getBounty } from './getBounty';
import { BountyUpdate } from './interfaces';

export async function updateBountySettings ({
  bountyId,
  updateContent
}: BountyUpdate): Promise<Bounty> {

  if (updateContent.rewardAmount === null || (typeof updateContent.rewardAmount === 'number' && updateContent.rewardAmount <= 0)) {
    throw new PositiveNumbersOnlyError();
  }

  const bounty = await getBounty(bountyId);

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${bountyId} not found`);
  }

  if (typeof updateContent.maxSubmissions === 'number' && bounty.maxSubmissions !== null && updateContent.maxSubmissions < countValidSubmissions(bounty.applications)) {
    throw new InvalidInputError('New bounty cap cannot be lower than total of active and valid submissions.');
  }

  const updatedBounty = await prisma.bounty.update({
    where: {
      id: bountyId
    },
    data: {
      updatedAt: new Date(),
      title: updateContent.title,
      descriptionNodes: updateContent.descriptionNodes as string,
      description: updateContent.description,
      chainId: updateContent.chainId,
      rewardAmount: updateContent.rewardAmount,
      rewardToken: updateContent.rewardToken,
      approveSubmitters: updateContent.approveSubmitters,
      maxSubmissions: updateContent.maxSubmissions,
      linkedTaskId: updateContent.linkedTaskId
    }
  });

  if (!updatedBounty) {
    throw new DataNotFoundError(`Bounty with ID ${bountyId} not found`);
  }

  if (updateContent.permissions) {
    await setBountyPermissions({
      bountyId,
      permissionsToAssign: updateContent.permissions
    });
  }

  return updatedBounty;
}
