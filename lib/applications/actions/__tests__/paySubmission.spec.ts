
import { Space, User } from '@prisma/client';
import { WrongStateError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { paySubmission } from '../paySubmission';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('paySubmission', () => {
  it('should return the updated submission with a paid status when paid', async () => {

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      applicationStatus: 'complete',
      bountyCap: null
    });

    const reviewed = await paySubmission(bountyWithSubmission.applications[0].id);

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
      await paySubmission(bountyWithSubmission.applications[0].id);
      throw new ExpectedAnError();
    }
    catch (error: any) {
      expect(error).toBeInstanceOf(WrongStateError);
    }
  });
});
