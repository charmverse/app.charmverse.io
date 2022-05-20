
import { Bounty, BountyStatus, PageOperations, PagePermissionLevel, Space, User } from '@prisma/client';
import { computeUserPagePermissions, permissionTemplates, upsertPermission } from 'lib/permissions/pages';
import { createPage, generateUserAndSpaceWithApiToken, generateBountyWithSingleApplication, generateSpaceUser, generateBounty } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { ExpectedAnError } from 'testing/errors';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';
import { DataNotFoundError, InvalidInputError, UnauthorisedActionError, LimitReachedError, PositiveNumbersOnlyError, DuplicateDataError, StringTooShortError, MissingDataError } from 'lib/utilities/errors';
import { createBounty } from 'lib/bounties/createBounty';
import { prisma } from 'db';
import { createApplication } from '../createApplication';
import { MINIMUM_APPLICATION_MESSAGE_CHARACTERS } from '../../shared';
import { createSubmission } from '../createSubmission';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('createSubmission', () => {

  it('should create a submission in review status', async () => {

    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      approveSubmitters: false
    });

    const submission = await createSubmission({
      bountyId: bounty.id,
      userId: user.id,
      submissionContent: {
        submission: 'My submission',
        submissionNodes: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"My submission"}]}]}'
      }
    });

    expect(submission.status).toBe('review');

  });

  it('should fail if the bounty is not in open status', async () => {

    const notOpenStatuses = (Object.keys(BountyStatus) as BountyStatus[]).filter(status => status !== 'open');

    const bounties = await Promise.all(
      notOpenStatuses.map(status => generateBounty({
        createdBy: user.id,
        spaceId: space.id,
        status,
        approveSubmitters: false
      }))
    );

    for (const bounty of bounties) {
      try {
        await createSubmission({
          bountyId: bounty.id,
          userId: user.id,
          submissionContent: {
            submission: 'My submission',
            submissionNodes: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"My submission"}]}]}'
          }
        });

        throw new ExpectedAnError();
      }
      catch (err) {
        expect(err).toBeInstanceOf(UnauthorisedActionError);
      }
    }

  });

  it('should fail if the bounty requires submitters to be approved first', async () => {

    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      approveSubmitters: true
    });

    try {
      await createSubmission({
        bountyId: bounty.id,
        userId: user.id,
        submissionContent: {
          submission: 'My submission',
          submissionNodes: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"My submission"}]}]}'
        }
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(UnauthorisedActionError);
    }

  });

  it('should fail if the bounty does not exist', async () => {

    try {
      await createSubmission({
        bountyId: v4(),
        userId: user.id,
        submissionContent: {
          submission: 'My submission',
          submissionNodes: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"My submission"}]}]}'
        }
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }

  });

  it('should fail if the user already has a submission', async () => {

    const bountyWithApp = await generateBountyWithSingleApplication({
      applicationStatus: 'inProgress',
      bountyCap: 3,
      spaceId: space.id,
      userId: user.id
    });

    try {
      await createSubmission({
        bountyId: bountyWithApp.id,
        userId: user.id,
        submissionContent: {
          submission: 'My submission',
          submissionNodes: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"My submission"}]}]}'
        }
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DuplicateDataError);
    }

  });

  it('should fail if the cap of submissions has been reached', async () => {

    const secondUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

    const bountyWithApp = await generateBountyWithSingleApplication({
      applicationStatus: 'inProgress',
      bountyCap: 1,
      spaceId: space.id,
      userId: user.id
    });

    try {
      await createSubmission({
        bountyId: bountyWithApp.id,
        userId: secondUser.id,
        submissionContent: {
          submission: 'My submission',
          submissionNodes: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"My submission"}]}]}'
        }
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(UnauthorisedActionError);
    }

  });

  it('should fail if no submission content is provided', async () => {

    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      approveSubmitters: false
    });

    try {
      await createSubmission({
        bountyId: bounty.id,
        userId: user.id,
        submissionContent: {
          submission: '',
          submissionNodes: ''
        }
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      console.log(err);
      expect(err).toBeInstanceOf(MissingDataError);
    }

  });

});

