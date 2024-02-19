import { humanizeConditions, humanizeConditionsData } from '../humanizeConditions';
import type { TokenGateConditions } from '../interfaces';

describe('humanizeConditions', () => {
  const walletAddress = '0x1bd0d6edb387114b2fdf20d683366fa9f94a07f4';

  it('should return an owned wallet address condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: [
        {
          chain: 1,
          method: 'balanceOf',
          tokenIds: [walletAddress],
          type: 'Wallet',
          contractAddress: '',
          quantity: '1',
          condition: 'evm',
          image: '/images/cryptoLogos/ethereum-eth-logo.svg'
        }
      ]
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Controls wallet with address 0x1bd0…07f4');
  });

  it('should return owned eth on a specific L2 blockchain condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: [
        {
          chain: 10,
          method: 'getBalance',
          tokenIds: [],
          type: 'ERC20',
          condition: 'evm',
          contractAddress: '',
          quantity: '1000000000000000000',
          name: 'Optimism',
          image: '/images/cryptoLogos/optimism.svg'
        }
      ]
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 1 ETH on Optimism');
  });

  it('should return owned token on a supported blockchain condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: [
        {
          chain: 56,
          method: 'getBalance',
          tokenIds: [],
          condition: 'evm',
          contractAddress: '',
          quantity: '12000000000000000000',
          type: 'ERC20',
          image: '/images/cryptoLogos/binance-coin-bnb-logo.svg'
        }
      ]
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 12 BNB on Binance Smart Chain');
  });

  it('should return owned eth on ethereum condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: [
        {
          chain: 1,
          method: 'getBalance',
          tokenIds: [],
          condition: 'evm',
          contractAddress: '',
          quantity: '100000000000',
          type: 'ERC20',
          image: '/images/cryptoLogos/ethereum-eth-logo.svg'
        }
      ]
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 0.0000001 ETH on Ethereum');
  });

  it('should return owned custom token on ethereum condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: [
        {
          chain: 1,
          method: 'getBalance',
          tokenIds: [],
          condition: 'evm',
          contractAddress: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
          quantity: '12000000000000000000',
          type: 'ERC20',
          name: 'Pepe',
          image: 'https://static.alchemyapi.io/images/assets/24478.png'
        }
      ]
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 12 of Pepe tokens on Ethereum');
  });

  it('should return specific POAP condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: [
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
      ],
      operator: 'OR'
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owner of a ETHDenver POAP on Gnosis or Owner of a ETHDenver POAP on Ethereum');
  });

  it('should return owns any POAP condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: [
        {
          chain: 1,
          method: 'balanceOf',
          tokenIds: [],
          condition: 'evm',
          contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
          quantity: '1',
          type: 'ERC721',
          image: '/images/cryptoLogos/ethereum-eth-logo.svg'
        }
      ]
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns any POAP');
  });

  it('should return the owner of a dao condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: [
        {
          chain: 1,
          method: 'members',
          tokenIds: [],
          condition: 'evm',
          contractAddress: '0x38064F40B20347d58b326E767791A6f79cdEddCe',
          quantity: '1',
          type: 'MolochDAOv2.1',
          image: '/images/cryptoLogos/ethereum-eth-logo.svg'
        }
      ]
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Is a member of the DAO at 0x3806…ddce');
  });

  it('should return the owner of at least 1 NFT from a specific collection condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: [
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
      ]
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 1 of Charmed & Optimistic NFT on Optimism');
  });

  it('should return the owner of a specific nft condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: [
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
      ]
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owner of Charmed & Optimistic 71 NFT with token id 71 on Optimism');
  });

  it('should return an erc1155 condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: [
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
      ]
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 1 of Charmed & Optimistic 71 tokens with token id 72 on Ethereum');
  });

  it('should return an unlock protocol condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: [
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
      ]
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Unlock Protocol - The Cool One');
  });

  it('should return a hypersub condition', () => {
    const conditions: TokenGateConditions = {
      accessControlConditions: [
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
      ]
    };
    const data = humanizeConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Hypersub - The Cool One');
  });
});
