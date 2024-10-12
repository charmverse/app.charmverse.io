import { convertCostToPoints, convertCostToUsdDisplay } from '../utils';

describe('NFT utils', () => {
  it('convertCostToUsd', async () => {
    const result = convertCostToUsdDisplay(10000000000n, 'en-us');
    expect(result).toEqual('$10,000');
  });

  it('convertCostToPoints', async () => {
    const result = convertCostToPoints(10000000000n);
    expect(result).toEqual(100000);
  });
});
