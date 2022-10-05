
import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { DataNotFoundError, InvalidInputError, UndesirableOperationError, WrongStateError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateBountyWithSingleApplication, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { reviewSubmission } from '../reviewSubmission';

let user: User;
let reviewer: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
  reviewer = await generateSpaceUser({ isAdmin: false, spaceId: space.id });
});

describe('reviewSubmission', () => {

  it('should return the updated submission with a complete status when reviewed, and record who approved or rejected it.', async () => {

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      applicationStatus: 'review',
      bountyCap: null
    });

    const reviewed = await reviewSubmission({
      submissionId: bountyWithSubmission.applications[0].id,
      decision: 'approve',
      userId: reviewer.id
    });

    expect(reviewed.status).toBe('complete');
    expect(reviewed.reviewedBy).toBe(reviewer.id);
  });

  it('should return the updated submission with a rejected status when reject action is initiated', async () => {

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      applicationStatus: 'review',
      bountyCap: null
    });

    const reviewed = await reviewSubmission({
      submissionId: bountyWithSubmission.applications[0].id,
      decision: 'reject',
      userId: reviewer.id
    });

    expect(reviewed.status).toBe('rejected');
  });

  it('should fail if the reviewer is the same person as the submitter', async () => {

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
        decision: 'approve',
        userId: user.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(UndesirableOperationError);
    }
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
        decision: 'invalid decision' as any,
        userId: reviewer.id
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
        decision: 'approve',
        userId: reviewer.id
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
        decision: 'approve',
        userId: reviewer.id
      });
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(WrongStateError);
    }
  });
});

