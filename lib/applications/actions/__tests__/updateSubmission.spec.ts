
import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { DataNotFoundError, MissingDataError, UnauthorisedActionError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateSubmissionContent } from 'testing/generate-stubs';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import type { SubmissionContent } from '../../interfaces';
import { updateSubmission } from '../updateSubmission';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('updateSubmission', () => {

  it('should return the updated submission', async () => {

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: null
    });

    const submissionUpdate: SubmissionContent = {
      submission: 'New content',
      submissionNodes: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"New content"}]}]}',
      walletAddress: '0x123456789'
    };

    const updated = await updateSubmission({
      submissionId: bountyWithSubmission.applications[0].id,
      submissionContent: submissionUpdate
    });

    expect(updated.submission).toBe(submissionUpdate.submission);
    expect(updated.submissionNodes).toBe(submissionUpdate.submissionNodes);

  });

  it('should auto-set the submission to review status if it is marked as in progress', async () => {
    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: null
    });

    const submissionUpdate: SubmissionContent = {
      submission: 'New content',
      submissionNodes: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"New content"}]}]}',
      walletAddress: '0x123456789'
    };

    const updated = await updateSubmission({
      submissionId: bountyWithSubmission.applications[0].id,
      submissionContent: submissionUpdate
    });

    expect(updated.status).toBe('review');
  });

  it('should fail if the submission does not exist', async () => {

    try {
      await updateSubmission({
        submissionId: v4(),
        submissionContent: generateSubmissionContent()
      });
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('should fail if empty submission content is provided', async () => {

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: null
    });

    const submissionUpdate: SubmissionContent = {
      submission: '',
      submissionNodes: '',
      walletAddress: '0x0'
    };

    try {
      await updateSubmission({
        submissionId: bountyWithSubmission.applications[0].id,
        submissionContent: submissionUpdate
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(MissingDataError);
    }
  });

  it('should fail if the bounty is not open or in progress', async () => {

    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'complete',
      applicationStatus: 'inProgress',
      bountyCap: null
    });

    const submissionUpdate: SubmissionContent = generateSubmissionContent();

    try {
      await updateSubmission({
        submissionId: bountyWithSubmission.applications[0].id,
        submissionContent: submissionUpdate
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(UnauthorisedActionError);
    }
  });

  it('should fail if the application is not in progress or in review', async () => {
    const bountyWithSubmission = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyStatus: 'open',
      applicationStatus: 'complete',
      bountyCap: null
    });

    const submissionUpdate: SubmissionContent = generateSubmissionContent();

    try {
      await updateSubmission({
        submissionId: bountyWithSubmission.applications[0].id,
        submissionContent: submissionUpdate
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(UnauthorisedActionError);
    }
  });

});

