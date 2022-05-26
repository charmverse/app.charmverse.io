import { Space, User } from '@prisma/client';
import { createTransaction } from 'lib/transactions/createTransaction';
import { generateBounty, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { createSubmission } from '../createSubmission';
import { listSubmissions } from '../listSubmissions';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('listSubmissions', () => {
  it('Should retrieve transaction for a submission', async () => {
    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      approveSubmitters: false
    });

    const application = await createSubmission({
      bountyId: bounty.id,
      userId: user.id,
      submissionContent: {
        submission: 'Hello World',
        submissionNodes: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"My submission"}]}]}'
      }
    });

    await createTransaction({
      applicationId: application.id,
      chainId: '4',
      transactionId: '123'
    });

    const submissionsWithTransaction = await listSubmissions(bounty.id);
    expect(submissionsWithTransaction.length).toBe(1);
    expect(submissionsWithTransaction[0].transactions.length).toBe(1);
  });
});
