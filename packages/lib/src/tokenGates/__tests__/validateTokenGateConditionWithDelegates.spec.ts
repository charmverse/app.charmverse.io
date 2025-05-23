import { prisma } from '@charmverse/core/prisma-client';
import type { AccessControlCondition } from '@packages/lib/tokenGates/interfaces';
import { validateTokenGateConditionWithDelegates } from '@packages/lib/tokenGates/validateTokenGateConditionWithDelegates';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import { vi } from 'vitest';

const validWallet = randomETHWalletAddress();

vi.mock('../validateTokenGateCondition', () => ({
  validateTokenGateCondition: (condition: any, address: string) => {
    return address === validWallet;
  }
}));

vi.mock('@packages/lib/blockchain/delegateXYZ/client', () => ({
  getIncomingDelegations: async () => [
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
    vi.resetModules();
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
