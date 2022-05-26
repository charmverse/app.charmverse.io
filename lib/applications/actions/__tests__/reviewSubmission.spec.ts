
import { Space, User } from '@prisma/client';
import { DataNotFoundError, InvalidInputError, WrongStateError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { reviewSubmission } from '../reviewSubmission';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('reviewSubmission', () => {

  it('should return the updated submission with a complete status when approved', async () => {

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      applicationStatus: 'review',
      bountyCap: null
    });

    const reviewed = await reviewSubmission({
      submissionId: bountyWithSubmission.applications[0].id,
      decision: 'approve'
    });

    expect(reviewed.status).toBe('complete');
  });

  it('should return the updated submission with a complete status when approved', async () => {

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      applicationStatus: 'complete',
      bountyCap: null
    });

    const reviewed = await reviewSubmission({
      submissionId: bountyWithSubmission.applications[0].id,
      decision: 'pay'
    });

    expect(reviewed.status).toBe('paid');
  });

  it('should return the updated submission with a paid status when pay action is initiated', async () => {

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      applicationStatus: 'review',
      bountyCap: null
    });

    const reviewed = await reviewSubmission({
      submissionId: bountyWithSubmission.applications[0].id,
      decision: 'reject'
    });

    expect(reviewed.status).toBe('rejected');
  });

  it('should fail if the decision is not approve or reject', async () => {

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      applicationStatus: 'review',
      bountyCap: null
    });

    try {
      await reviewSubmission({
        submissionId: bountyWithSubmission.applications[0].id,
        decision: 'invalid decision' as any
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should fail if the submission does not exist', async () => {

    try {
      await reviewSubmission({
        submissionId: v4(),
        decision: 'approve'
      });
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('should fail if trying to approve a submission that is not in review status', async () => {

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: null
    });

    try {
      await reviewSubmission({
        submissionId: bountyWithSubmission.applications[0].id,
        decision: 'approve'
      });
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(WrongStateError);
    }
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
      await reviewSubmission({
        submissionId: bountyWithSubmission.applications[0].id,
        decision: 'pay'
      });
      throw new ExpectedAnError();
    }
    catch (error: any) {
      expect(error).toBeInstanceOf(WrongStateError);
    }
  });
});

