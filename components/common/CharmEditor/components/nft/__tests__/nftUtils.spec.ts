import { extractAttrsFromUrl } from '../nftUtils';

const extractionCases = [
  {
    url: 'https://opensea.io/fr/assets/ethereum/0x1185e1eef5d34fdac843bb6b15fd9ac588a3ab21/1273',
    result: {
      chain: 1,
      contract: '0x1185e1eef5d34fdac843bb6b15fd9ac588a3ab21',
      token: '1273'
    }
  },
  {
    url: 'https://opensea.io/assets/ethereum/0x1185e1eef5d34fdac843bb6b15fd9ac588a3ab21/1273',
    result: {
      chain: 1,
      contract: '0x1185e1eef5d34fdac843bb6b15fd9ac588a3ab21',
      token: '1273'
    }
  },
  {
    // we only support ethereum for now
    url: 'https://opensea.io/assets/arbitrum/0xfae39ec09730ca0f14262a636d2d7c5539353752/168724',
    result: null
  }
];

describe('NFT Utils', () => {
  extractionCases.forEach((testCase) => {
    test(`extractAttrsFromUrl() should match OpenSea URL: ${testCase.url}`, () => {
      expect(extractAttrsFromUrl(testCase.url)).toEqual(testCase.result);
    });
  });
});
