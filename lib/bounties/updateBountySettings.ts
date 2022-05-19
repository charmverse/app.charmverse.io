import { Bounty } from '@prisma/client';
import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';
import { BountyUpdate } from './interfaces';

export async function updateBountySettings ({
  bountyId,
  updateContent
}: BountyUpdate): Promise<Bounty> {

  const updatedBounty = await prisma.bounty.update({
    where: {
      id: bountyId
    },
    data: {
      title: updateContent.title,
      descriptionNodes: updateContent.descriptionNodes as string,
      description: updateContent.description,
      reviewer: updateContent.reviewer,
      chainId: updateContent.chainId,
      rewardAmount: updateContent.rewardAmount,
      rewardToken: updateContent.rewardToken,
      approveSubmitters: updateContent.approveSubmitters,
      maxSubmissions: updateContent.maxSubmissions
    }
  });

  if (!updatedBounty) {
    throw new DataNotFoundError(`Bounty with ID ${bountyId} not found`);
  }

  return updatedBounty;
}
