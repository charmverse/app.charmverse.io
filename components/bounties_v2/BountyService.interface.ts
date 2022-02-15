import { Bounty as IBounty } from 'models/Bounty';

export interface IBountyService {
  listBounties(): Promise<IBounty []>

  readBounty(bountyId: string): Promise<IBounty>

  createBounty(bounty: Partial<IBounty>): Promise<IBounty>

  updateBounty(bountyId: string, newValues: Partial<IBounty>): Promise<IBounty>

  deleteBounty(bountyId: string): Promise<boolean>
}
