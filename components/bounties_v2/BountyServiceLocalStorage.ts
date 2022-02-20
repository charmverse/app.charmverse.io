import { v4 } from 'uuid';
import { Bounty } from '@prisma/client';
import { getStorageValue, setStorageValue } from 'hooks/useLocalStorage';
import { IBountyService } from './BountyService.interface';

export class LocalStorageBountyService implements IBountyService {

  private storageLocation = 'Bounties';

  listBounties (): Promise<Bounty []> {
    const existingBounties = getStorageValue(this.storageLocation, []);

    return Promise.resolve(existingBounties);
  }

  async readBounty (bountyId: string): Promise<Bounty> {
    const existingBounties = await this.listBounties();

    const requestedBounty = existingBounties.find(bounty => {
      return bounty.id === bountyId;
    });

    if (requestedBounty !== undefined) {
      return requestedBounty;
    }
    else {
      throw new Error('Bounty not found');
    }
  }

  async createBounty (bounty: Partial<Bounty>): Promise<Bounty> {
    bounty.id = v4();
    bounty.createdAt = new Date();
    bounty.status = 'open';

    const bountyList = await this.listBounties();

    bountyList.push(bounty as Bounty);

    setStorageValue(this.storageLocation, bountyList);

    return bounty as Bounty;
  }

  updateBounty (bountyId: string, newValues: Partial<Bounty>): Promise<Bounty> {
    throw new Error('Method not implemented.');
  }

  deleteBounty (bountyId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

}
