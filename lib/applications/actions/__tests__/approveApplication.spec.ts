
import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { createBounty, updateBountySettings } from 'lib/bounties';
import { LimitReachedError, UndesirableOperationError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { approveApplication } from '../approveApplication';
import { createApplication } from '../createApplication';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('approveApplication', () => {

  it('should approve an application if the bounty submissions cap has not been reached, and record who approved it', async () => {

    const reviewerUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      maxSubmissions: 20,
      permissions: {
        reviewer: [{ group: 'user', id: reviewerUser.id }],
        submitter: [{ group: 'space', id: space.id }]
      }
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'My application message',
      userId: user.id
    });

    const approved = await approveApplication({
      userId: reviewerUser.id,
      applicationOrApplicationId: application
    });

    expect(approved.status).toBe('inProgress');
    expect(approved.acceptedBy).toBe(reviewerUser.id);

  });

  it('should fail to approve the application if the limit of active submissions has been reached', async () => {

    const { user: adminUser, space: adminSpace } = await generateUserAndSpaceWithApiToken(undefined, true);

    const reviewerUser = await generateSpaceUser({
      spaceId: adminSpace.id,
      isAdmin: false
    });

    const bounty = await createBounty({
      createdBy: adminUser.id,
      spaceId: adminSpace.id
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'My application message',
      userId: adminUser.id
    });

    await updateBountySettings({
      bountyId: bounty.id,
      updateContent: {
        maxSubmissions: 0
      }
    });

    try {
      await approveApplication({
        userId: reviewerUser.id,
        applicationOrApplicationId: application
      });
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(LimitReachedError);
    }

  });

  it('should fail if a user tries to approve their own application, even if they are an admin', async () => {

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      maxSubmissions: 20,
      permissions: {
        reviewer: [{ group: 'user', id: user.id }],
        submitter: [{ group: 'space', id: space.id }]
      }
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'My application message',
      userId: user.id
    });

    await expect(approveApplication({
      userId: user.id,
      applicationOrApplicationId: application
    })).rejects.toBeInstanceOf(UndesirableOperationError);

  });

});

