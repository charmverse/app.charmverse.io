import { getNFTUrl } from '@packages/lib/blockchain/utils';

import { extractAttrsFromUrl } from '../utils';

describe('NFT Utils', () => {
  const extractionCases = [
    {
      // basic example
      url: 'https://opensea.io/assets/ethereum/0x1185e1eef5d34fdac843bb6b15fd9ac588a3ab21/1273',
      result: {
        chain: 1,
        contract: '0x1185e1eef5d34fdac843bb6b15fd9ac588a3ab21',
        token: '1273'
      }
    },
    {
      // supports foreign language urls
      url: 'https://opensea.io/fr/assets/ethereum/0x1185e1eef5d34fdac843bb6b15fd9ac588a3ab21/1273',
      result: {
        chain: 1,
        contract: '0x1185e1eef5d34fdac843bb6b15fd9ac588a3ab21',
        token: '1273'
      }
    },
    {
      // polygon
      url: 'https://opensea.io/assets/matic/0x78f887a92602bb58cc7a8bba3fb83a11393568fc/67875155203898376266226417105519496041030022655099455128664563017684613070889',
      result: {
        chain: 137,
        contract: '0x78f887a92602bb58cc7a8bba3fb83a11393568fc',
        token: '67875155203898376266226417105519496041030022655099455128664563017684613070889'
      }
    },
    {
      // arbitrum
      url: 'https://opensea.io/assets/arbitrum/0xebba467ecb6b21239178033189ceae27ca12eadf/77',
      result: {
        chain: 42161,
        contract: '0xebba467ecb6b21239178033189ceae27ca12eadf',
        token: '77'
      }
    },
    {
      // optimism
      url: 'https://opensea.io/assets/optimism/0x0d42d13e3e2f97b1589525cd2f288caac79593ae/0',
      result: {
        chain: 10,
        contract: '0x0d42d13e3e2f97b1589525cd2f288caac79593ae',
        token: '0'
      }
    },
    {
      // ignores an unrecognized network (ex: klaytn)
      url: 'https://opensea.io/assets/klaytn/0xe35587bd1985c98173ce7b6ab6fc0f9ae3a53e79/3816',
      result: null
    }
  ];

  extractionCases.forEach((testCase) => {
    test(`extractAttrsFromUrl() should match OpenSea URL: ${testCase.url}`, () => {
      expect(extractAttrsFromUrl(testCase.url)).toEqual(testCase.result);
    });
  });

  const toURLCases = [
    {
      // ethereum
      url: 'https://opensea.io/assets/ethereum/0x1185e1eef5d34fdac843bb6b15fd9ac588a3ab21/1273',
      nft: {
        chain: 1,
        contract: '0x1185e1eef5d34fdac843bb6b15fd9ac588a3ab21',
        token: '1273'
      }
    },
    {
      // polygon
      url: 'https://opensea.io/assets/matic/0x78f887a92602bb58cc7a8bba3fb83a11393568fc/67875155203898376266226417105519496041030022655099455128664563017684613070889',
      nft: {
        chain: 137,
        contract: '0x78f887a92602bb58cc7a8bba3fb83a11393568fc',
        token: '67875155203898376266226417105519496041030022655099455128664563017684613070889'
      }
    },
    {
      // arbitrum
      url: 'https://opensea.io/assets/arbitrum/0xebba467ecb6b21239178033189ceae27ca12eadf/77',
      nft: {
        chain: 42161,
        contract: '0xebba467ecb6b21239178033189ceae27ca12eadf',
        token: '77'
      }
    },
    {
      // optimism
      url: 'https://opensea.io/assets/optimism/0x0d42d13e3e2f97b1589525cd2f288caac79593ae/0',
      nft: {
        chain: 10,
        contract: '0x0d42d13e3e2f97b1589525cd2f288caac79593ae',
        token: '0'
      }
    }
  ];

  toURLCases.forEach((testCase) => {
    test(`getNFTUrl() should generate a URL for test case`, () => {
      const url = getNFTUrl({
        chain: testCase.nft.chain,
        token: testCase.nft.token,
        contract: testCase.nft.contract
      });
      expect(url).toEqual(testCase.url);
    });
  });
});
