import type { Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { AccessControlCondition } from '@root/lib/tokenGates/interfaces';
import { validateTokenGateConditionWithDelegates } from '@root/lib/tokenGates/validateTokenGateConditionWithDelegates';
import { verifyTokenGateMemberships } from '@root/lib/tokenGates/verifyTokenGateMemberships';
import { walletAddress } from 'stories/lib/mockTokenGataData';

import { randomETHWalletAddress } from 'testing/generateStubs';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { clearTokenGateData, deleteTokenGate, generateTokenGate } from 'testing/utils/tokenGates';

async function getSpaceUser({ spaceId, userId }: { spaceId: string; userId: string }) {
  return prisma.spaceRole.findUnique({
    where: {
      spaceUser: {
        spaceId,
        userId
      }
    }
  });
}

const validWallet = randomETHWalletAddress();

jest.mock('lib/tokenGates/validateTokenGateCondition', () => ({
  validateTokenGateCondition: (condition: any, address: string) => {
    return address === validWallet;
  }
}));

jest.mock('lib/blockchain/delegateXYZ/client', () => ({
  getIncomingDelegations: () => [
    // an example delegation that provides all access to an address
    {
      type: 'ALL',
      to: '0x8F4f94A6aA61612f6B97EBE2d50dB7e141Dcd658',
      from: validWallet,
      contract: '0x0000000000000000000000000000000000000000',
      rights: '',
      tokenId: 0,
      amount: 0
    }
  ]
}));

describe('validateTokenGateConditionWithDelegates', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('should return valid for an address that is delegated thru Delegate.xyz', async () => {
    const condition: AccessControlCondition = {
      chain: 1,
      method: 'balanceOf',
      tokenIds: [validWallet],
      type: 'Wallet',
      contractAddress: '',
      quantity: '1',
      condition: 'evm'
    };
    const res = await validateTokenGateConditionWithDelegates(condition, randomETHWalletAddress());
    expect(res).toEqual(true);
  });
});
