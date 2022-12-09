import { Wallet } from 'ethers';

import { getGnosisSafeUrl, getGnosisTransactionQueueUrl } from '../utils';

const safeAddress = Wallet.createRandom().address;

const baseUrl = 'https://app.safe.global';

/*
This file tests the gnosis safe url generation for the intersection of networks supported by CharmVerse (as defined by our connectors.ts file) and Gnosis Safe.
See Gnosis docs for currently supported neworks: https://docs.gnosis-safe.io/contracts/gnosis-safe-on-other-evm-based-networks
*/

describe('getGnosisTransactionQueueUrl', () => {
  it('should return a link to the safe transaction queue inside the Gnosis Safe app on the correct chain', () => {
    expect(getGnosisTransactionQueueUrl(safeAddress, 1)).toBe(`${baseUrl}/eth:${safeAddress}/transactions/queue`);
    expect(getGnosisTransactionQueueUrl(safeAddress, 5)).toBe(`${baseUrl}/gor:${safeAddress}/transactions/queue`);
    expect(getGnosisTransactionQueueUrl(safeAddress, 100)).toBe(`${baseUrl}/gno:${safeAddress}/transactions/queue`);
    expect(getGnosisTransactionQueueUrl(safeAddress, 42161)).toBe(`${baseUrl}/arb1:${safeAddress}/transactions/queue`);
    expect(getGnosisTransactionQueueUrl(safeAddress, 43114)).toBe(`${baseUrl}/avax:${safeAddress}/transactions/queue`);
    expect(getGnosisTransactionQueueUrl(safeAddress, 56)).toBe(`${baseUrl}/bnb:${safeAddress}/transactions/queue`);
    expect(getGnosisTransactionQueueUrl(safeAddress, 10)).toBe(`${baseUrl}/oeth:${safeAddress}/transactions/queue`);
    expect(getGnosisTransactionQueueUrl(safeAddress, 137)).toBe(`${baseUrl}/matic:${safeAddress}/transactions/queue`);
  });
});

describe('getGnosisSafeUrl', () => {
  it('should return a link to the safe transaction queue inside the Gnosis Safe app on the correct chain', () => {
    expect(getGnosisSafeUrl(safeAddress, 1)).toBe(`${baseUrl}/eth:${safeAddress}`);
    expect(getGnosisSafeUrl(safeAddress, 5)).toBe(`${baseUrl}/gor:${safeAddress}`);
    expect(getGnosisSafeUrl(safeAddress, 100)).toBe(`${baseUrl}/gno:${safeAddress}`);
    expect(getGnosisSafeUrl(safeAddress, 42161)).toBe(`${baseUrl}/arb1:${safeAddress}`);
    expect(getGnosisSafeUrl(safeAddress, 43114)).toBe(`${baseUrl}/avax:${safeAddress}`);
    expect(getGnosisSafeUrl(safeAddress, 56)).toBe(`${baseUrl}/bnb:${safeAddress}`);
    expect(getGnosisSafeUrl(safeAddress, 10)).toBe(`${baseUrl}/oeth:${safeAddress}`);
    expect(getGnosisSafeUrl(safeAddress, 137)).toBe(`${baseUrl}/matic:${safeAddress}`);
  });
});
