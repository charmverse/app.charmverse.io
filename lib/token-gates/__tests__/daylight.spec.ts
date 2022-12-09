import type { EVMChain } from 'lit-js-sdk';

import { getDaylightRequirements } from '../daylight';

const walletCondition = {
  chain: 'ethereum' as EVMChain,
  accessType: 'individual_wallet',
  returnValueTest: { value: '0x123', key: '', comparator: '' },
  contractAddress: '',
  standardContractType: 'ERC20' as const,
  method: '',
  parameters: [':userAddress']
};

const tokenCondition = {
  chain: 'ethereum' as EVMChain,
  accessType: 'individual_wallet',
  returnValueTest: { value: '1337', key: '', comparator: '' },
  contractAddress: '0x00001',
  standardContractType: 'ERC20' as const,
  method: 'balanceOf',
  parameters: []
};

const nftCondition = {
  chain: 'ethereum' as EVMChain,
  accessType: 'individual_wallet',
  returnValueTest: { value: '', key: '', comparator: '' },
  contractAddress: '0x00002',
  standardContractType: 'ERC20' as const,
  method: 'ownerOf',
  parameters: ['1337']
};

describe('getDaylightRequirements', () => {
  it('should return address based requirement', () => {
    const tokenGateConditions = [walletCondition];

    expect(getDaylightRequirements(tokenGateConditions)).toEqual({
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
    const tokenGateConditions = [tokenCondition];

    expect(getDaylightRequirements(tokenGateConditions)).toEqual({
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
    const tokenGateConditions = [nftCondition];

    expect(getDaylightRequirements(tokenGateConditions)).toEqual({
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
    const tokenGateConditions = [nftCondition, { operator: 'OR' as const }, tokenCondition];

    expect(getDaylightRequirements(tokenGateConditions)).toEqual({
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
    const tokenGateConditions = [nftCondition, { operator: 'AND' as const }, tokenCondition];

    expect(getDaylightRequirements(tokenGateConditions)).toEqual({
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
    const tokenGateConditions = [nftCondition, tokenCondition, walletCondition];

    expect(getDaylightRequirements(tokenGateConditions)).toEqual({
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
    const tokenGateConditions = [
      nftCondition,
      { operator: 'AND' as const },
      tokenCondition,
      { operator: 'OR' as const },
      walletCondition
    ];

    expect(getDaylightRequirements(tokenGateConditions)).toEqual({
      operator: 'AND',
      requirements: []
    });
  });

  it('should return requirements for nested conditions', () => {
    const tokenGateConditions = [
      [nftCondition, { operator: 'OR' as const }, walletCondition],
      { operator: 'OR' as const },
      tokenCondition
    ];

    expect(getDaylightRequirements(tokenGateConditions)).toEqual({
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
});
