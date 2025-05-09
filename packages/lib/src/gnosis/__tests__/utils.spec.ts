import { randomETHWalletAddress } from '@packages/utils/blockchain';

import { getGnosisSafeUrl, getGnosisTransactionQueueUrl, getGnosisTransactionUrl } from '../utils';

const safeAddress = randomETHWalletAddress();

const baseUrl = 'https://app.safe.global';

/*
This file tests the gnosis safe url generation for the intersection of networks supported by CharmVerse (as defined by our connectors.ts file) and Gnosis Safe.
See Gnosis docs for currently supported neworks: https://docs.gnosis-safe.io/contracts/gnosis-safe-on-other-evm-based-networks
*/

describe('getGnosisTransactionQueueUrl', () => {
  it('should return a link to the safe transaction queue inside the Gnosis Safe app on the correct chain', () => {
    expect(getGnosisTransactionQueueUrl(safeAddress, 1)).toBe(`${baseUrl}/eth:${safeAddress}/transactions/queue`);
    expect(getGnosisTransactionQueueUrl(safeAddress, 11155111)).toBe(
      `${baseUrl}/sep:${safeAddress}/transactions/queue`
    );
    expect(getGnosisTransactionQueueUrl(safeAddress, 100)).toBe(`${baseUrl}/gno:${safeAddress}/transactions/queue`);
    expect(getGnosisTransactionQueueUrl(safeAddress, 42161)).toBe(`${baseUrl}/arb1:${safeAddress}/transactions/queue`);
    expect(getGnosisTransactionQueueUrl(safeAddress, 43114)).toBe(`${baseUrl}/avax:${safeAddress}/transactions/queue`);
    expect(getGnosisTransactionQueueUrl(safeAddress, 56)).toBe(`${baseUrl}/bnb:${safeAddress}/transactions/queue`);
    expect(getGnosisTransactionQueueUrl(safeAddress, 137)).toBe(`${baseUrl}/matic:${safeAddress}/transactions/queue`);
  });
});

describe('getSafeTransactionUrl', () => {
  it('should return a link to the safe transaction queue inside the Gnosis Safe app on the correct chain', () => {
    const exampleHash = '0x1234567890123456789012345678901234567890123456789012345678901234';

    expect(getGnosisTransactionUrl(safeAddress, 1, exampleHash)).toBe(
      `${baseUrl}/transactions/tx?safe=eth:${safeAddress}&id=${exampleHash}`
    );
    expect(getGnosisTransactionUrl(safeAddress, 11155111, exampleHash)).toBe(
      `${baseUrl}/transactions/tx?safe=sep:${safeAddress}&id=${exampleHash}`
    );
    expect(getGnosisTransactionUrl(safeAddress, 11155111, exampleHash)).toBe(
      `${baseUrl}/transactions/tx?safe=sep:${safeAddress}&id=${exampleHash}`
    );
    expect(getGnosisTransactionUrl(safeAddress, 42161, exampleHash)).toBe(
      `${baseUrl}/transactions/tx?safe=arb1:${safeAddress}&id=${exampleHash}`
    );
  });
});

describe('getGnosisSafeUrl', () => {
  it('should return a link to the safe transaction queue inside the Gnosis Safe app on the correct chain', () => {
    expect(getGnosisSafeUrl(safeAddress, 1)).toBe(`${baseUrl}/eth:${safeAddress}`);
    expect(getGnosisSafeUrl(safeAddress, 11155111)).toBe(`${baseUrl}/sep:${safeAddress}`);
    expect(getGnosisSafeUrl(safeAddress, 100)).toBe(`${baseUrl}/gno:${safeAddress}`);
    expect(getGnosisSafeUrl(safeAddress, 42161)).toBe(`${baseUrl}/arb1:${safeAddress}`);
    expect(getGnosisSafeUrl(safeAddress, 43114)).toBe(`${baseUrl}/avax:${safeAddress}`);
    expect(getGnosisSafeUrl(safeAddress, 56)).toBe(`${baseUrl}/bnb:${safeAddress}`);
    expect(getGnosisSafeUrl(safeAddress, 137)).toBe(`${baseUrl}/matic:${safeAddress}`);
  });
});
