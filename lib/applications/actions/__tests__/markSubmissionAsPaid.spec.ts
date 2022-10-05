
import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { WrongStateError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { markSubmissionAsPaid } from '../markSubmissionAsPaid';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
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

    try {
      await markSubmissionAsPaid(bountyWithSubmission.applications[0].id);
      throw new ExpectedAnError();
    }
    catch (error: any) {
      expect(error).toBeInstanceOf(WrongStateError);
    }
  });
});
