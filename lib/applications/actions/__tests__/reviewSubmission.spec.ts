
import { Bounty, BountyStatus, PageOperations, PagePermissionLevel, Space, User } from '@prisma/client';
import { computeUserPagePermissions, permissionTemplates, upsertPermission } from 'lib/permissions/pages';
import { createPage, generateUserAndSpaceWithApiToken, generateBountyWithSingleApplication, generateSpaceUser, generateBounty } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { ExpectedAnError } from 'testing/errors';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';
import { DataNotFoundError, InvalidInputError, UnauthorisedActionError, LimitReachedError, PositiveNumbersOnlyError, DuplicateDataError, StringTooShortError, MissingDataError, WrongStateError } from 'lib/utilities/errors';
import { createBounty } from 'lib/bounties/createBounty';
import { prisma } from 'db';
import { generateSubmissionContent } from 'testing/generate-stubs';
import { createApplication } from '../createApplication';
import { MINIMUM_APPLICATION_MESSAGE_CHARACTERS } from '../../shared';
import { createSubmission } from '../createSubmission';
import { SubmissionContent, SubmissionUpdateData } from '../../interfaces';
import { updateSubmission } from '../updateSubmission';
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

  it('should return the updated submission with a rejected status when rejected', async () => {

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

});

