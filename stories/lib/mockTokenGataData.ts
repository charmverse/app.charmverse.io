import type { TokenGateEvaluationResult } from 'lib/tokenGates/evaluateEligibility';
import type { AccessControlCondition, TokenGateWithRoles } from 'lib/tokenGates/interfaces';
import { createMockTokenGate } from 'testing/mocks/tokenGate';

import { spaces as _spaces, spaceRoles } from '../lib/mockData';

const walletAddress = '0x1bd0d6edb387114b2fdf20d683366fa9f94a07f4';
const ownsWalletCondition = [
  {
    chain: 'ethereum',
    method: '',
    parameters: [':userAddress'],
    conditionType: 'evm' as const,
    contractAddress: '',
    returnValueTest: {
      value: walletAddress,
      comparator: '='
    },
    standardContractType: '',
    image: '/images/cryptoLogos/ethereum-eth-logo.svg'
  }
];

const ownedEVMTokenCondition = [
  {
    chain: 'optimism',
    method: 'eth_getBalance',
    parameters: [':userAddress', 'latest'],
    conditionType: 'evm' as const,
    contractAddress: '',
    returnValueTest: {
      value: '1000000000000000000',
      comparator: '>='
    },
    standardContractType: '',
    image: '/images/cryptoLogos/optimism.svg'
  }
];

const ownedTokenSupportedBlockchain = [
  {
    chain: 'bsc',
    method: 'eth_getBalance',
    parameters: [':userAddress', 'latest'],
    conditionType: 'evm' as const,
    contractAddress: '',
    returnValueTest: {
      value: '12000000000000000000',
      comparator: '>='
    },
    standardContractType: '',
    image: '/images/cryptoLogos/binance-coin-bnb-logo.svg'
  }
];

const ownedEth = [
  {
    chain: 'ethereum',
    method: 'eth_getBalance',
    parameters: [':userAddress', 'latest'],
    conditionType: 'evm' as const,
    contractAddress: '',
    returnValueTest: {
      value: '100000000000',
      comparator: '>='
    },
    standardContractType: '',
    image: '/images/cryptoLogos/ethereum-eth-logo.svg'
  }
];

const ownedCustomToken = [
  {
    chain: 'ethereum',
    method: 'balanceOf',
    parameters: [':userAddress'],
    conditionType: 'evm' as const,
    contractAddress: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    returnValueTest: {
      value: '12000000000000000000',
      comparator: '>='
    },
    standardContractType: 'ERC20',
    name: 'Pepe',
    image: 'https://static.alchemyapi.io/images/assets/24478.png'
  }
];

const ownsSpecificPoap = [
  {
    chain: 'xdai',
    method: 'tokenURI',
    parameters: [],
    conditionType: 'evm' as const,
    contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
    returnValueTest: {
      value: 'ETHDenver',
      comparator: 'contains'
    },
    standardContractType: 'POAP',
    image: '/images/cryptoLogos/gnosis-logo.svg'
  },
  {
    operator: 'or'
  },
  {
    chain: 'ethereum',
    method: 'tokenURI',
    parameters: [],
    conditionType: 'evm' as const,
    contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
    returnValueTest: {
      value: 'ETHDenver',
      comparator: 'contains'
    },
    standardContractType: 'POAP',
    image: '/images/cryptoLogos/ethereum-eth-logo.svg'
  }
];

const ownsAnyPoap = [
  {
    chain: 'ethereum',
    method: 'balanceOf',
    parameters: [],
    conditionType: 'evm' as const,
    contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
    returnValueTest: {
      value: '0',
      comparator: '>'
    },
    standardContractType: 'ERC721',
    image: '/images/cryptoLogos/ethereum-eth-logo.svg'
  }
];

const daoMember = [
  {
    chain: 'ethereum',
    method: 'members',
    parameters: [':userAddress'],
    conditionType: 'evm' as const,
    contractAddress: '0x38064F40B20347d58b326E767791A6f79cdEddCe',
    returnValueTest: {
      value: 'true',
      comparator: '='
    },
    standardContractType: 'MolochDAOv2.1',
    image: '/images/cryptoLogos/ethereum-eth-logo.svg'
  }
];

const nftCollectionOwner = [
  {
    chain: 'optimism',
    method: 'balanceOf',
    parameters: [':userAddress'],
    conditionType: 'evm' as const,
    contractAddress: '0xfd22bfe1bc51e21fd5e212680e22fa2503fee6c8',
    returnValueTest: {
      value: '1',
      comparator: '>='
    },
    standardContractType: 'ERC721',
    name: 'Charmed & Optimistic',
    image: 'https://nft-cdn.alchemy.com/opt-mainnet/15fbbfc26e8d7d51b9b7031faff07333'
  }
];

const specificNftOwner = [
  {
    chain: 'optimism',
    method: 'ownerOf',
    parameters: ['71'],
    conditionType: 'evm' as const,
    contractAddress: '0xfd22bfe1bc51e21fd5e212680e22fa2503fee6c8',
    returnValueTest: {
      value: ':userAddress',
      comparator: '='
    },
    standardContractType: 'ERC721',
    name: 'Charmed & Optimistic 71',
    image: 'https://nft-cdn.alchemy.com/opt-mainnet/5bad9b012e2980c9880dbce2e5642167'
  }
];

const multipleErc = [
  {
    chain: 'ethereum',
    method: 'balanceOf',
    parameters: [':userAddress', '72'],
    conditionType: 'evm' as const,
    contractAddress: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    returnValueTest: {
      value: '1',
      comparator: '>='
    },
    standardContractType: 'ERC1155',
    name: 'Pepe',
    image: 'https://static.alchemyapi.io/images/assets/24478.png'
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
  mockTokenGate(multipleErc)
];

export const mockTokenGateResult: TokenGateEvaluationResult = {
  walletAddress: '0x1234',
  canJoinSpace: true,
  eligibleGates: mockTokenGates.map((tokenGate) => tokenGate.id)
};

function mockTokenGate(gate: AccessControlCondition[]) {
  return createMockTokenGate({
    type: 'lit',
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
