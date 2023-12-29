import type { Chain } from '@lit-protocol/types';

import { getDaylightLitRequirements, getDaylightUnlockRequirements } from '../daylight';

const walletCondition = {
  chain: 'ethereum' as Chain,
  accessType: 'individual_wallet',
  returnValueTest: { value: '0x123', key: '', comparator: '' },
  contractAddress: '',
  standardContractType: 'ERC20' as const,
  method: '',
  parameters: [':userAddress']
};

const tokenCondition = {
  chain: 'ethereum' as Chain,
  accessType: 'individual_wallet',
  returnValueTest: { value: '1337', key: '', comparator: '' },
  contractAddress: '0x00001',
  standardContractType: 'ERC20' as const,
  method: 'balanceOf',
  parameters: []
};

const nftCondition = {
  chain: 'ethereum' as Chain,
  accessType: 'individual_wallet',
  returnValueTest: { value: '', key: '', comparator: '' },
  contractAddress: '0x00002',
  standardContractType: 'ERC20' as const,
  method: 'ownerOf',
  parameters: ['1337']
};

const unlockCondition = {
  chainId: 1,
  contract: '0x00003'
};

describe('getDaylightRequirements', () => {
  it('should return address based requirement', () => {
    const tokenGateConditions = { unifiedAccessControlConditions: [walletCondition] };

    expect(getDaylightLitRequirements(tokenGateConditions)).toEqual({
      operator: 'OR',
      requirements: [
        {
          addresses: ['0x123'],
          type: 'onAllowlist',
          chain: 'ethereum'
        }
      ]
    });
  });

  it('should return token based requirement', () => {
    const tokenGateConditions = { unifiedAccessControlConditions: [tokenCondition] };

    expect(getDaylightLitRequirements(tokenGateConditions)).toEqual({
      operator: 'OR',
      requirements: [
        {
          address: '0x00001',
          type: 'hasTokenBalance',
          minAmount: 1337,
          chain: 'ethereum'
        }
      ]
    });
  });

  it('should return nft based requirement', () => {
    const tokenGateConditions = { unifiedAccessControlConditions: [nftCondition] };

    expect(getDaylightLitRequirements(tokenGateConditions)).toEqual({
      operator: 'OR',
      requirements: [
        {
          address: '0x00002',
          type: 'hasNftWithSpecificId',
          id: ['1337'],
          chain: 'ethereum'
        }
      ]
    });
  });

  it('should return requirements based on multiple conditions with OR operator', () => {
    const tokenGateConditions = {
      unifiedAccessControlConditions: [nftCondition, { operator: 'OR' as const }, tokenCondition]
    };

    expect(getDaylightLitRequirements(tokenGateConditions)).toEqual({
      operator: 'OR',
      requirements: [
        {
          address: '0x00002',
          type: 'hasNftWithSpecificId',
          id: ['1337'],
          chain: 'ethereum'
        },
        {
          address: '0x00001',
          type: 'hasTokenBalance',
          minAmount: 1337,
          chain: 'ethereum'
        }
      ]
    });
  });

  it('should return requirements based on multiple conditions with AND operator', () => {
    const tokenGateConditions = {
      unifiedAccessControlConditions: [nftCondition, { operator: 'AND' as const }, tokenCondition]
    };

    expect(getDaylightLitRequirements(tokenGateConditions)).toEqual({
      operator: 'AND',
      requirements: [
        {
          address: '0x00002',
          type: 'hasNftWithSpecificId',
          id: ['1337'],
          chain: 'ethereum'
        },
        {
          address: '0x00001',
          type: 'hasTokenBalance',
          minAmount: 1337,
          chain: 'ethereum'
        }
      ]
    });
  });

  it('should return requirements with default OR operator', () => {
    const tokenGateConditions = { unifiedAccessControlConditions: [nftCondition, tokenCondition, walletCondition] };

    expect(getDaylightLitRequirements(tokenGateConditions)).toEqual({
      operator: 'OR',
      requirements: [
        {
          address: '0x00002',
          type: 'hasNftWithSpecificId',
          id: ['1337'],
          chain: 'ethereum'
        },
        {
          address: '0x00001',
          type: 'hasTokenBalance',
          minAmount: 1337,
          chain: 'ethereum'
        },
        {
          addresses: ['0x123'],
          type: 'onAllowlist',
          chain: 'ethereum'
        }
      ]
    });
  });

  it('should not return conditions with mixed operators', () => {
    const tokenGateConditions = {
      unifiedAccessControlConditions: [
        nftCondition,
        { operator: 'AND' as const },
        tokenCondition,
        { operator: 'OR' as const },
        walletCondition
      ]
    };

    expect(getDaylightLitRequirements(tokenGateConditions)).toEqual({
      operator: 'AND',
      requirements: []
    });
  });

  it('should return requirements for nested conditions', () => {
    const tokenGateConditions = {
      unifiedAccessControlConditions: [
        ...[nftCondition, { operator: 'OR' as const }, walletCondition],
        { operator: 'OR' as const },
        tokenCondition
      ]
    };

    expect(getDaylightLitRequirements(tokenGateConditions)).toEqual({
      operator: 'OR',
      requirements: [
        {
          address: '0x00002',
          type: 'hasNftWithSpecificId',
          id: ['1337'],
          chain: 'ethereum'
        },
        {
          addresses: ['0x123'],
          type: 'onAllowlist',
          chain: 'ethereum'
        },
        {
          address: '0x00001',
          type: 'hasTokenBalance',
          minAmount: 1337,
          chain: 'ethereum'
        }
      ]
    });
  });

  it('should return unlock protocol based requirement', () => {
    const tokenGateConditions = unlockCondition;

    expect(getDaylightUnlockRequirements(tokenGateConditions)).toEqual({
      operator: 'OR',
      requirements: [
        {
          chain: 'ethereum',
          type: 'hasTokenBalance',
          address: '0x00003',
          minAmount: 1
        }
      ]
    });
  });
});
