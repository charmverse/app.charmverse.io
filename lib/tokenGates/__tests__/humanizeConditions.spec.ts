import {
  humanizeConditions,
  humanizeHypersubConditionsData,
  humanizeLitConditionsData,
  humanizeUnlockConditionsData
} from '../humanizeConditions';

describe('humanizeConditions', () => {
  const walletAddress = '0x1bd0d6edb387114b2fdf20d683366fa9f94a07f4';

  it('should return an owned wallet address condition', () => {
    const conditions = {
      chains: ['ethereum'],
      permanent: true,
      authSigTypes: ['ethereum'],
      unifiedAccessControlConditions: [
        {
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          conditionType: 'evmBasic' as const,
          contractAddress: '',
          returnValueTest: {
            value: walletAddress,
            comparator: '='
          },
          standardContractType: '',
          image: '/images/cryptoLogos/ethereum-eth-logo.svg'
        }
      ]
    };
    const data = humanizeLitConditionsData({ ...conditions, myWalletAddress: '' });
    const result = humanizeConditions(data);
    expect(result).toBe('Controls wallet with address 0x1bd0…07f4');
  });

  it('should return owner wallet condition', () => {
    const conditions = {
      chains: ['ethereum'],
      permanent: true,
      authSigTypes: ['ethereum'],
      unifiedAccessControlConditions: [
        {
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          conditionType: 'evmBasic' as const,
          contractAddress: '',
          returnValueTest: {
            value: walletAddress,
            comparator: '='
          },
          standardContractType: '',
          image: '/images/cryptoLogos/ethereum-eth-logo.svg'
        }
      ]
    };
    const data = humanizeLitConditionsData({ ...conditions, myWalletAddress: walletAddress });
    const result = humanizeConditions(data);
    expect(result).toBe('Controls your wallet 0x1bd0…07f4');
  });

  it('should return owned eth on a specific L2 blockchain condition', () => {
    const conditions = {
      chains: ['optimism'],
      permanent: true,
      authSigTypes: ['ethereum'],
      unifiedAccessControlConditions: [
        {
          chain: 'optimism',
          method: 'eth_getBalance',
          parameters: [':userAddress', 'latest'],
          conditionType: 'evmBasic' as const,
          contractAddress: '',
          returnValueTest: {
            value: '1000000000000000000',
            comparator: '>='
          },
          standardContractType: '',
          image: '/images/cryptoLogos/optimism.svg'
        }
      ]
    };
    const data = humanizeLitConditionsData({ ...conditions, myWalletAddress: '' });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 1 ETH on Optimism');
  });

  it('should return owned token on a supported blockchain condition', () => {
    const conditions = {
      chains: ['bsc'],
      permanent: true,
      authSigTypes: ['ethereum'],
      unifiedAccessControlConditions: [
        {
          chain: 'bsc',
          method: 'eth_getBalance',
          parameters: [':userAddress', 'latest'],
          conditionType: 'evmBasic' as const,
          contractAddress: '',
          returnValueTest: {
            value: '12000000000000000000',
            comparator: '>='
          },
          standardContractType: '',
          image: '/images/cryptoLogos/binance-coin-bnb-logo.svg'
        }
      ]
    };
    const data = humanizeLitConditionsData({ ...conditions, myWalletAddress: '' });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 12 BNB on Bsc');
  });

  it('should return owned eth on ethereum condition', () => {
    const conditions = {
      chains: ['ethereum'],
      permanent: true,
      authSigTypes: ['ethereum'],
      unifiedAccessControlConditions: [
        {
          chain: 'ethereum',
          method: 'eth_getBalance',
          parameters: [':userAddress', 'latest'],
          conditionType: 'evmBasic' as const,
          contractAddress: '',
          returnValueTest: {
            value: '100000000000',
            comparator: '>='
          },
          standardContractType: '',
          image: '/images/cryptoLogos/ethereum-eth-logo.svg'
        }
      ]
    };
    const data = humanizeLitConditionsData({ ...conditions, myWalletAddress: '' });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 0.0000001 ETH on Ethereum');
  });

  it('should return owned custom token on ethereum condition', () => {
    const conditions = {
      chains: ['ethereum'],
      permanent: true,
      authSigTypes: ['ethereum'],
      unifiedAccessControlConditions: [
        {
          chain: 'ethereum',
          method: 'balanceOf',
          parameters: [':userAddress'],
          conditionType: 'evmBasic' as const,
          contractAddress: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
          returnValueTest: {
            value: '12000000000000000000',
            comparator: '>='
          },
          standardContractType: 'ERC20',
          name: 'Pepe',
          image: 'https://static.alchemyapi.io/images/assets/24478.png'
        }
      ]
    };
    const data = humanizeLitConditionsData({ ...conditions, myWalletAddress: '' });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 12 of Pepe tokens on Ethereum');
  });

  it('should return specific POAP condition', () => {
    const conditions = {
      chains: ['xdai', 'ethereum'],
      permanent: true,
      authSigTypes: ['ethereum'],
      unifiedAccessControlConditions: [
        {
          chain: 'xdai',
          method: 'tokenURI',
          parameters: [],
          conditionType: 'evmBasic' as const,
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
          conditionType: 'evmBasic' as const,
          contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
          returnValueTest: {
            value: 'ETHDenver',
            comparator: 'contains'
          },
          standardContractType: 'POAP',
          image: '/images/cryptoLogos/ethereum-eth-logo.svg'
        }
      ]
    };
    const data = humanizeLitConditionsData({ ...conditions, myWalletAddress: '' });
    const result = humanizeConditions(data);
    expect(result).toBe('Owner of a ETHDenver POAP on Xdai or Owner of a ETHDenver POAP on Ethereum');
  });

  it('should return owns any POAP condition', () => {
    const conditions = {
      chains: ['xdai', 'ethereum'],
      permanent: true,
      authSigTypes: ['ethereum'],
      unifiedAccessControlConditions: [
        {
          chain: 'ethereum',
          method: 'balanceOf',
          parameters: [],
          conditionType: 'evmBasic' as const,
          contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
          returnValueTest: {
            value: '0',
            comparator: '>'
          },
          standardContractType: 'ERC721',
          image: '/images/cryptoLogos/ethereum-eth-logo.svg'
        }
      ]
    };
    const data = humanizeLitConditionsData({ ...conditions, myWalletAddress: '' });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns any POAP');
  });

  it('should return the owner of a dao condition', () => {
    const conditions = {
      chains: ['ethereum'],
      permanent: true,
      authSigTypes: ['ethereum'],
      unifiedAccessControlConditions: [
        {
          chain: 'ethereum',
          method: 'members',
          parameters: [':userAddress'],
          conditionType: 'evmBasic' as const,
          contractAddress: '0x38064F40B20347d58b326E767791A6f79cdEddCe',
          returnValueTest: {
            value: 'true',
            comparator: '='
          },
          standardContractType: 'MolochDAOv2.1',
          image: '/images/cryptoLogos/ethereum-eth-logo.svg'
        }
      ]
    };
    const data = humanizeLitConditionsData({ ...conditions, myWalletAddress: '' });
    const result = humanizeConditions(data);
    expect(result).toBe('Is a member of the DAO at 0x3806…ddce');
  });

  it('should return the owner of at least 1 NFT from a specific collection condition', () => {
    const conditions = {
      chains: ['optimism'],
      permanent: true,
      authSigTypes: ['ethereum'],
      unifiedAccessControlConditions: [
        {
          chain: 'optimism',
          method: 'balanceOf',
          parameters: [':userAddress'],
          conditionType: 'evmBasic' as const,
          contractAddress: '0xfd22bfe1bc51e21fd5e212680e22fa2503fee6c8',
          returnValueTest: {
            value: '1',
            comparator: '>='
          },
          standardContractType: 'ERC721',
          name: 'Charmed & Optimistic',
          image: 'https://nft-cdn.alchemy.com/opt-mainnet/15fbbfc26e8d7d51b9b7031faff07333'
        }
      ]
    };
    const data = humanizeLitConditionsData({ ...conditions, myWalletAddress: '' });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 1 of Charmed & Optimistic NFT on Optimism');
  });

  it('should return the owner of a specific nft condition', () => {
    const conditions = {
      chains: ['optimism'],
      permanent: true,
      authSigTypes: ['ethereum'],
      unifiedAccessControlConditions: [
        {
          chain: 'optimism',
          method: 'ownerOf',
          parameters: ['71'],
          conditionType: 'evmBasic' as const,
          contractAddress: '0xfd22bfe1bc51e21fd5e212680e22fa2503fee6c8',
          returnValueTest: {
            value: ':userAddress',
            comparator: '='
          },
          standardContractType: 'ERC721',
          name: 'Charmed & Optimistic 71',
          image: 'https://nft-cdn.alchemy.com/opt-mainnet/5bad9b012e2980c9880dbce2e5642167'
        }
      ]
    };
    const data = humanizeLitConditionsData({ ...conditions, myWalletAddress: '' });
    const result = humanizeConditions(data);
    expect(result).toBe('Owner of Charmed & Optimistic 71 NFT with token id 71 on Optimism');
  });

  it('should return the cask condition', () => {
    const conditions = {
      chains: ['optimism'],
      permanent: true,
      authSigTypes: ['ethereum'],
      unifiedAccessControlConditions: [
        {
          chain: 'ethereum',
          method: 'getActiveSubscriptionCount',
          parameters: [':userAddress', 'test', '5467'],
          conditionType: 'evmBasic' as const,
          contractAddress: '0xfd22bfe1bc51e21fd5e212680e22fa2503fee6c8',
          returnValueTest: {
            value: ':userAddress',
            comparator: '='
          },
          standardContractType: 'CASK'
        }
      ]
    };
    const data = humanizeLitConditionsData({ ...conditions, myWalletAddress: '' });
    const result = humanizeConditions(data);
    expect(result).toBe('Cask subscriber to provider test for plan 5467 on Ethereum');
  });

  it('should return an erc1155 condition', () => {
    const conditions = {
      chains: ['ethereum'],
      permanent: true,
      authSigTypes: ['ethereum'],
      unifiedAccessControlConditions: [
        {
          chain: 'ethereum',
          method: 'balanceOf',
          parameters: [':userAddress', '72'],
          conditionType: 'evmBasic' as const,
          contractAddress: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
          returnValueTest: {
            value: '1',
            comparator: '>='
          },
          standardContractType: 'ERC1155',
          name: 'Pepe',
          image: 'https://static.alchemyapi.io/images/assets/24478.png'
        }
      ]
    };
    const data = humanizeLitConditionsData({ ...conditions, myWalletAddress: '' });
    const result = humanizeConditions(data);
    expect(result).toBe('Owns at least 1 of Pepe tokens with token id 72 on Ethereum');
  });

  it('should return an unlock protocol condition', () => {
    const conditions = {
      contract: '0x1f98431c8ad12323631ae4a59f267346ea31f984',
      chainId: 1,
      name: 'The Cool One'
    } as const;
    const data = humanizeUnlockConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Unlock Protocol - The Cool One');
  });

  it('should return a hypersub condition', () => {
    const conditions = {
      contract: '0x1f98431c8ad12323631ae4a59f267346ea31f984',
      chainId: 1,
      name: 'The Cool One'
    } as const;
    const data = humanizeHypersubConditionsData({ ...conditions });
    const result = humanizeConditions(data);
    expect(result).toBe('Hypersub - The Cool One');
  });
});
