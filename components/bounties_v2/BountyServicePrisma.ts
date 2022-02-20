import { v4 } from 'uuid';
import { getStorageValue, setStorageValue } from 'hooks/useLocalStorage';
import { prisma } from 'db';
import { Bounty } from '@prisma/client';

import charmClient from 'charmClient';
import { IBountyService } from './BountyService.interface';

export class PrismaBountyService implements IBountyService {

  private storageLocation = 'Bounties';

  listBounties (workspaceId?: string): Promise<Bounty []> {
    return charmClient.listBounties(workspaceId);
  }

  async createBounty (bounty: Partial<Bounty>): Promise<Bounty> {
    return charmClient.createBounty(bounty);
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

  updateBounty (bountyId: string, newValues: Partial<Bounty>): Promise<Bounty> {
    throw new Error('Method not implemented.');
  }

  deleteBounty (bountyId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

}
