import { createMockTokenGate } from '@packages/testing/mocks/tokenGate';
import type { TokenGateEvaluationResult } from '@root/lib/tokenGates/evaluateEligibility';
import type { AccessControlCondition, TokenGateWithRoles } from '@root/lib/tokenGates/interfaces';

import { spaces as _spaces, spaceRoles } from '../lib/mockData';

export const walletAddress = '0x1bd0d6edb387114b2fdf20d683366fa9f94a07f4';
export const ownsWalletCondition: AccessControlCondition[] = [
  {
    chain: 1,
    method: 'balanceOf',
    tokenIds: [walletAddress],
    type: 'Wallet',
    contractAddress: '',
    quantity: '1',
    condition: 'evm',
    image: '/images/cryptoLogos/ethereum-icon-purple.svg'
  }
];

export const ownedEVMTokenCondition: AccessControlCondition[] = [
  {
    chain: 10,
    method: 'eth_getBalance',
    tokenIds: [],
    type: 'ERC20',
    condition: 'evm',
    contractAddress: '',
    quantity: '1000000000000000000',
    name: 'Optimism',
    image: '/images/cryptoLogos/optimism.svg'
  }
];

export const ownedTokenSupportedBlockchain: AccessControlCondition[] = [
  {
    chain: 56,
    method: 'eth_getBalance',
    tokenIds: [],
    condition: 'evm',
    contractAddress: '',
    quantity: '12000000000000000000',
    type: 'ERC20',
    image: '/images/cryptoLogos/binance-coin-bnb-logo.svg'
  }
];

export const ownedEth: AccessControlCondition[] = [
  {
    chain: 1,
    method: 'eth_getBalance',
    tokenIds: [],
    condition: 'evm',
    contractAddress: '',
    quantity: '100000000000',
    type: 'ERC20',
    image: '/images/cryptoLogos/ethereum-icon-purple.svg'
  }
];

export const ownedCustomToken: AccessControlCondition[] = [
  {
    chain: 1,
    method: 'eth_getBalance',
    tokenIds: [],
    condition: 'evm',
    contractAddress: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    quantity: '12000000000000000000',
    type: 'ERC20',
    name: 'Pepe',
    image: 'https://static.alchemyapi.io/images/assets/24478.png'
  }
];

export const ownsSpecificPoap: AccessControlCondition[] = [
  {
    chain: 100,
    method: 'eventName',
    tokenIds: ['ETHDenver'],
    condition: 'evm' as const,
    contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
    quantity: '1',
    type: 'POAP',
    image: '/images/cryptoLogos/gnosis-logo.svg'
  },
  {
    chain: 1,
    method: 'eventName',
    tokenIds: ['ETHDenver'],
    condition: 'evm' as const,
    contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
    quantity: '1',
    type: 'POAP',
    image: '/images/cryptoLogos/gnosis-logo.svg'
  }
];

export const ownsAnyPoap: AccessControlCondition[] = [
  {
    chain: 1,
    method: 'balanceOf',
    tokenIds: [],
    condition: 'evm',
    contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
    quantity: '1',
    type: 'ERC721',
    image: '/images/cryptoLogos/ethereum-icon-purple.svg'
  }
];

export const daoMember: AccessControlCondition[] = [
  {
    chain: 1,
    method: 'members',
    tokenIds: [],
    condition: 'evm',
    contractAddress: '0x38064F40B20347d58b326E767791A6f79cdEddCe',
    quantity: '1',
    type: 'MolochDAOv2.1',
    image: '/images/cryptoLogos/ethereum-icon-purple.svg'
  }
];

export const nftCollectionOwner: AccessControlCondition[] = [
  {
    chain: 10,
    method: 'balanceOf',
    tokenIds: [],
    condition: 'evm',
    contractAddress: '0xfd22bfe1bc51e21fd5e212680e22fa2503fee6c8',
    quantity: '1',
    type: 'ERC721',
    name: 'Charmed & Optimistic',
    image: 'https://nft-cdn.alchemy.com/opt-mainnet/15fbbfc26e8d7d51b9b7031faff07333'
  }
];

export const specificNftOwner: AccessControlCondition[] = [
  {
    chain: 10,
    method: 'ownerOf',
    tokenIds: ['71'],
    condition: 'evm',
    contractAddress: '0xfd22bfe1bc51e21fd5e212680e22fa2503fee6c8',
    quantity: '1',
    type: 'ERC721',
    name: 'Charmed & Optimistic 71',
    image: 'https://nft-cdn.alchemy.com/opt-mainnet/5bad9b012e2980c9880dbce2e5642167'
  }
];

export const multipleErc: AccessControlCondition[] = [
  {
    chain: 1,
    method: 'balanceOf',
    tokenIds: ['72'],
    condition: 'evm',
    contractAddress: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    quantity: '1',
    type: 'ERC1155',
    name: 'Charmed & Optimistic 71',
    image: 'https://nft-cdn.alchemy.com/opt-mainnet/5bad9b012e2980c9880dbce2e5642167'
  }
];

export const unlockProtocolCondition: AccessControlCondition[] = [
  {
    chain: 1,
    method: 'balanceOf',
    tokenIds: [],
    condition: 'evm',
    contractAddress: '0x1f98431c8ad12323631ae4a59f267346ea31f984',
    quantity: '1',
    type: 'Unlock',
    name: 'The Cool One',
    image: 'https://nft-cdn.alchemy.com/opt-mainnet/5bad9b012e2980c9880dbce2e5642167'
  }
];

export const hypersubCondition: AccessControlCondition[] = [
  {
    chain: 1,
    method: 'balanceOf',
    tokenIds: [],
    condition: 'evm',
    contractAddress: '0x1f98431c8ad12323631ae4a59f267346ea31f984',
    quantity: '1',
    type: 'Hypersub',
    name: 'The Cool One',
    image: 'https://nft-cdn.alchemy.com/opt-mainnet/5bad9b012e2980c9880dbce2e5642167'
  }
];

export const guildCondition: AccessControlCondition[] = [
  {
    chain: 1,
    method: 'balanceOf',
    tokenIds: ['charmverse-guild'],
    condition: 'evm',
    contractAddress: '',
    quantity: '1',
    type: 'Guildxyz',
    image: '/images/logos/guild_logo.svg'
  }
];

export const gitcoinCondition: AccessControlCondition[] = [
  {
    chain: 1,
    method: 'balanceOf',
    tokenIds: [],
    condition: 'evm',
    contractAddress: '',
    quantity: '1',
    type: 'GitcoinPassport',
    image: '/images/logos/gitcoin_passport.svg'
  }
];

export const mockTokenGates: TokenGateWithRoles[] = [
  mockTokenGate(ownsWalletCondition),
  mockTokenGate(ownedEVMTokenCondition),
  mockTokenGate(ownedTokenSupportedBlockchain),
  mockTokenGate(ownedEth),
  mockTokenGate(ownedCustomToken),
  mockTokenGate(ownsSpecificPoap),
  mockTokenGate(ownsAnyPoap),
  mockTokenGate(daoMember),
  mockTokenGate(nftCollectionOwner),
  mockTokenGate(specificNftOwner),
  mockTokenGate(multipleErc),
  mockTokenGate(unlockProtocolCondition),
  mockTokenGate(hypersubCondition),
  mockTokenGate(guildCondition),
  mockTokenGate(gitcoinCondition)
];

export const mockTokenGateResult: TokenGateEvaluationResult = {
  canJoinSpace: true,
  eligibleGates: mockTokenGates.map((tokenGate) => tokenGate.id)
};

function mockTokenGate(gate: AccessControlCondition[]) {
  return createMockTokenGate({
    conditions: {
      accessControlConditions: gate
    },
    tokenGateToRoles: [
      {
        role: spaceRoles[0]
      }
    ]
  });
}
