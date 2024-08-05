import type { Space, User } from '@charmverse/core/prisma';
import { testUtilsUser } from '@charmverse/core/test';
import { WrongStateError } from '@root/lib/utils/errors';

import { generateBountyWithSingleApplication } from 'testing/setupDatabase';

import { markSubmissionAsPaid } from '../markSubmissionAsPaid';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  user = generated.user;
  space = generated.space;
});

describe('markSubmissionAsPaid', () => {
  it('should return the updated submission with a paid status when paid', async () => {
    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      applicationStatus: 'complete',
      bountyCap: null
    });

    const reviewed = await markSubmissionAsPaid(bountyWithSubmission.applications[0].id);

    expect(reviewed.status).toBe('paid');
  });

  it('should fail if trying to pay a submission that is not in completed status', async () => {
    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: null
    });

    await expect(markSubmissionAsPaid(bountyWithSubmission.applications[0].id)).rejects.toThrow(WrongStateError);
  });
});
