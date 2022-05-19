import { Bounty } from '@prisma/client';

export type BountyCreationData = Pick<Bounty, 'title' | 'spaceId' | 'createdBy'> & Partial<Bounty>

export type UpdateableBountyFields = Partial<Pick<Bounty, 'title' | 'descriptionNodes' | 'description' | 'reviewer' | 'chainId' | 'rewardAmount' | 'rewardToken' | 'approveSubmitters' | 'maxSubmissions'>>

export interface BountyUpdate {
  bountyId: string,
  updateContent: UpdateableBountyFields
}
