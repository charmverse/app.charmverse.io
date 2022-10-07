
import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { countValidSubmissions } from 'lib/applications/shared';
import { DataNotFoundError, WrongStateError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateUserAndSpaceWithApiToken, generateBountyWithSingleApplication, generateBounty } from 'testing/setupDatabase';

import { createApplication, createSubmission } from '../../applications/actions';
import { closeOutBounty } from '../closeOutBounty';
import { createBounty } from '../createBounty';
import { reviewBountySuggestion } from '../reviewBountySuggestion';

let nonAdminUser: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  space = generated.space;

});

describe('reviewBountySuggestion', () => {
  it('should update the bounty status to open if the suggestion is approved', async () => {
    const bounty = await generateBounty({
      approveSubmitters: true,
      createdBy: nonAdminUser.id,
      spaceId: space.id,
      status: 'suggestion'
    });

    const updated = await reviewBountySuggestion({
      bountyId: bounty.id,
      decision: 'approve'
    });

    expect(updated.status).toBe('open');
  });

  it('should delete the bounty suggestion if it is rejected and return true', async () => {
    const bounty = await generateBounty({
      approveSubmitters: true,
      createdBy: nonAdminUser.id,
      spaceId: space.id,
      status: 'suggestion'
    });

    const deleted = await reviewBountySuggestion({
      bountyId: bounty.id,
      decision: 'reject'
    });

    expect(deleted).toBe(true);
  });

  it('should fail if the existing status of the bounty is not "suggestion"', async () => {
    const bounty = await generateBounty({
      approveSubmitters: true,
      createdBy: nonAdminUser.id,
      spaceId: space.id,
      status: 'inProgress'
    });

    try {
      await reviewBountySuggestion({
        bountyId: bounty.id,
        decision: 'reject'
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(WrongStateError);
    }

  });

  // See rollupBountyStatus for how this works

  it('should fail if the bounty does not exist', async () => {

    try {
      await reviewBountySuggestion({
        bountyId: v4(),
        decision: 'approve'
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });
});
