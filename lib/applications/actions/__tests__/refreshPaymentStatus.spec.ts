import { prisma } from '@charmverse/core';
import type { User, Space } from '@charmverse/core/prisma';

import { refreshPaymentStatus } from 'lib/applications/actions/refreshPaymentStatus';
import { getSafeTxStatus } from 'lib/gnosis/getSafeTxStatus';
import { createTransaction } from 'lib/transactions/createTransaction';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { getPaymentTxById } from 'testing/utils/paymentTxs';

jest.mock('lib/gnosis/getSafeTxStatus', () => ({
  getSafeTxStatus: jest.fn()
}));
const getSafeTxStatusMock = getSafeTxStatus as jest.Mock;

describe('refreshPaymentStatus', () => {
  let user: User;
  let space: Space;

  beforeAll(async () => {
    jest.mock('lib/gnosis/getSafeTxStatus', () => ({
      getSafeTxStatus: getSafeTxStatusMock
    }));

    const generated = await generateUserAndSpaceWithApiToken(undefined, true);
    user = generated.user;
    space = generated.space;
  });

  it('should not update status if there are no transactions related to application', async () => {
    getSafeTxStatusMock.mockResolvedValue({ status: 'processing', safeTxHash: '0x123', chainTxHash: '0x456' });

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'complete',
      applicationStatus: 'complete',
      bountyCap: 1
    });

    const res = await refreshPaymentStatus(bountyWithSubmission.applications[0].id);
    const bounty = await prisma.bounty.findUnique({ where: { id: res.application.bountyId } });

    expect(res.application.status).toBe('complete');
    expect(res.updated).toBe(false);
    expect(bounty?.status).toBe('complete');
  });

  it('should update status to processing if tx was found but it was not sent yet', async () => {
    getSafeTxStatusMock.mockResolvedValue({ status: 'processing', safeTxHash: '0x123', chainTxHash: '0x456' });

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'complete',
      applicationStatus: 'complete',
      bountyCap: 1
    });

    const applicationId = bountyWithSubmission.applications[0].id;
    const transaction = await createTransaction({ applicationId, chainId: '1', transactionId: '0x123' });

    const res = await refreshPaymentStatus(applicationId);
    const bounty = await prisma.bounty.findUnique({ where: { id: res.application.bountyId } });
    const updatedTransaction = await getPaymentTxById(transaction.id);

    expect(res.application.status).toBe('processing');
    expect(res.updated).toBe(true);
    expect(bounty?.status).toBe('complete');
    expect(transaction.transactionId).toBe('0x123');
    // safeTxHash should be present, transactionid should be updated with one from blockchain
    expect(updatedTransaction?.safeTxHash).toBe('0x123');
    expect(updatedTransaction?.transactionId).toBe('0x456');
  });

  it('should update status to cancelled if tx was found but it was cancelled', async () => {
    getSafeTxStatusMock.mockResolvedValue({ status: 'cancelled', safeTxHash: '0x123', chainTxHash: '0x456' });

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'complete',
      applicationStatus: 'complete',
      bountyCap: 1
    });

    const applicationId = bountyWithSubmission.applications[0].id;
    const transaction = await createTransaction({ applicationId, chainId: '1', transactionId: '0x123' });

    const res = await refreshPaymentStatus(applicationId);
    const bounty = await prisma.bounty.findUnique({ where: { id: res.application.bountyId } });
    const updatedTransaction = await getPaymentTxById(transaction.id);

    expect(res.application.status).toBe('cancelled');
    expect(res.updated).toBe(true);
    expect(bounty?.status).toBe('complete');
    expect(transaction.transactionId).toBe('0x123');
    expect(updatedTransaction?.transactionId).toBe('0x456');
  });

  it('should update application and bounty status to paid when payment was sent', async () => {
    getSafeTxStatusMock.mockResolvedValue({ status: 'paid', safeTxHash: '0x123', chainTxHash: '0x456' });

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'complete',
      applicationStatus: 'complete',
      bountyCap: 1
    });

    const applicationId = bountyWithSubmission.applications[0].id;
    const transaction = await createTransaction({ applicationId, chainId: '1', transactionId: '0x123' });

    const res = await refreshPaymentStatus(applicationId);
    const bounty = await prisma.bounty.findUnique({ where: { id: res.application.bountyId } });
    const updatedTransaction = await getPaymentTxById(transaction.id);

    expect(res.application.status).toBe('paid');
    expect(res.updated).toBe(true);
    expect(bounty?.status).toBe('paid');
    expect(transaction.transactionId).toBe('0x123');
    expect(updatedTransaction?.transactionId).toBe('0x456');
  });

  it('should update applciation status to paid and bounty status to open when payment was sent, but cap was not reached', async () => {
    getSafeTxStatusMock.mockResolvedValue({ status: 'paid', safeTxHash: '0x123', chainTxHash: '0x456' });

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'complete',
      applicationStatus: 'complete',
      bountyCap: 2
    });

    const applicationId = bountyWithSubmission.applications[0].id;
    const transaction = await createTransaction({ applicationId, chainId: '1', transactionId: '0x123' });

    const res = await refreshPaymentStatus(applicationId);
    const bounty = await prisma.bounty.findUnique({ where: { id: res.application.bountyId } });
    const updatedTransaction = await getPaymentTxById(transaction.id);

    expect(res.application.status).toBe('paid');
    expect(res.updated).toBe(true);
    expect(bounty?.status).toBe('open');
    expect(transaction.transactionId).toBe('0x123');
    expect(updatedTransaction?.transactionId).toBe('0x456');
  });
});
