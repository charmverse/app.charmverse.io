import type { Application, Bounty, Space, User } from '@charmverse/core/prisma';
import { ExpectedAnError } from '@packages/testing/errors';
import { generateBounty, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { DataNotFoundError } from '@packages/utils/errors';
import { refreshPaymentStatus } from '@root/lib/rewards/refreshPaymentStatus';
import { work } from '@root/lib/rewards/work';
import { createTransaction } from '@root/lib/transactions/createTransaction';
import { v4 } from 'uuid';

jest.mock('lib/rewards/refreshPaymentStatus', () => ({
  refreshPaymentStatus: jest.fn()
}));
const mockedRefreshPaymentStatus: jest.Mocked<typeof refreshPaymentStatus> = refreshPaymentStatus;

let user: User;
let space: Space;
let bounty: Bounty;
let application: Application;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, true);
  user = generated.user;
  space = generated.space;
  bounty = await generateBounty({
    createdBy: user.id,
    spaceId: space.id,
    status: 'open',
    approveSubmitters: false
  });
  application = await work({
    rewardId: bounty.id,
    userId: user.id,
    submission: 'Hello World',
    submissionNodes:
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"My submission"}]}]}',
    walletAddress: '0x123456789'
  });
});

describe('createTransaction', () => {
  it('Should create transaction for a submission', async () => {
    const transaction = await createTransaction({
      applicationId: application.id,
      chainId: '4',
      transactionId: '123'
    });

    expect(transaction).not.toBeNull();
    expect(transaction.transactionId).toBe('123');
    expect(transaction.safeTxHash).toBeNull();
    expect(mockedRefreshPaymentStatus).not.toHaveBeenCalled();
  });

  it("Should throw error if application doesn't exist", async () => {
    const applicationId = v4();
    try {
      await createTransaction({
        applicationId,
        chainId: '4',
        transactionId: '123'
      });
      throw new ExpectedAnError();
    } catch (err: any) {
      expect(err).toBeInstanceOf(DataNotFoundError);
      expect(mockedRefreshPaymentStatus).not.toHaveBeenCalled();
    }
  });

  it('Should create transaction for a submission and refresh status if it is a multisig transaction (safeHashTx is present)', async () => {
    const transaction = await createTransaction({
      applicationId: application.id,
      chainId: '4',
      transactionId: '123',
      safeTxHash: '0x1234'
    });

    expect(transaction).not.toBeNull();
    expect(transaction.transactionId).toBe('123');
    expect(transaction.safeTxHash).toBe('0x1234');
    expect(mockedRefreshPaymentStatus).toHaveBeenCalled();
  });
});
