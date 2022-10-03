
import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { countValidSubmissions } from 'lib/applications/shared';
import { DataNotFoundError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateUserAndSpaceWithApiToken, generateBountyWithSingleApplication } from 'testing/setupDatabase';

import { createApplication, createSubmission } from '../../applications/actions';
import { closeOutBounty } from '../closeOutBounty';

let nonAdminUser: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  space = generated.space;

});

describe('closeOutBounty', () => {
  it('should update the bounty status to complete', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    const updatedBounty = await closeOutBounty(bounty.id);

    expect(updatedBounty.status).toBe('complete');
  });

  it('should change all "inProgress" and "review" submissions to rejected status', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    const updatedBounty = await closeOutBounty(bounty.id);

    expect(updatedBounty.applications[0].status).toBe('rejected');
  });

  it('should leave "applied" "complete" and "paid" submissions unchanged', async () => {
    const bountyWithApplied = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'applied',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    const bountyWithComplete = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'complete',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    const bountyWithPaid = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'paid',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    const [applied, complete, paid] = await Promise.all([
      bountyWithApplied, bountyWithComplete, bountyWithPaid
    ].map(bounty => closeOutBounty(bounty.id)));

    expect(applied.applications[0].status).toBe('applied');
    expect(complete.applications[0].status).toBe('complete');
    expect(paid.applications[0].status).toBe('paid');

  });

  it('should update the bounty cap to the new number of accepted submissions', async () => {
    // In progress should be come rejected which will lower valid bounties count
    const bountyWithInProgress = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    const bountyWithPaid = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'paid',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    const [closedBountyWithInProgressBecameRejected, closedBountyWithPaid] = await Promise.all([
      closeOutBounty(bountyWithInProgress.id),
      closeOutBounty(bountyWithPaid.id)
    ]);

    const oldInProgressCount = countValidSubmissions(bountyWithInProgress.applications);
    const newInProgressCount = countValidSubmissions(closedBountyWithInProgressBecameRejected.applications);

    expect(oldInProgressCount).toBe(1);
    expect(newInProgressCount).toBe(0);

    const oldPaidCount = countValidSubmissions(bountyWithPaid.applications);
    const newPaidCount = countValidSubmissions(closedBountyWithPaid.applications);

    expect(oldPaidCount).toBe(1);
    expect(newPaidCount).toBe(1);
  });

  // See rollupBountyStatus for how this works

  it('should fail if the bounty does not exist', async () => {

    try {
      await closeOutBounty(v4());
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });
});
