import { v4 as uuid } from 'uuid';

import { createApplication } from 'lib/applications/actions';
import { updateUserProfile } from 'lib/users/updateUserProfile';
import { generateBounty, generateProposal, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { sendUserNotifications } from '../sendNotifications';

describe('sendNotification()', () => {
  it('Should send a notification email only once', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken({
      email: `${Math.random()}@charmversetest.io`
    });

    await generateProposal({
      proposalStatus: 'discussion',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    const inProgressBounty = await generateBounty({
      id: uuid(),
      spaceId: space.id,
      createdBy: user.id,
      status: 'inProgress',
      approveSubmitters: false,
      title: 'My new bounty',
      bountyPermissions: {
        submitter: [
          {
            group: 'space',
            id: space.id
          }
        ]
      },
      pagePermissions: [
        {
          userId: user.id,
          permissionLevel: 'full_access'
        }
      ]
    });

    await createApplication({
      bountyId: inProgressBounty.id,
      message: 'My application message',
      userId: user.id,
      status: 'inProgress'
    });

    const notificationsNo = await sendUserNotifications();
    expect(notificationsNo).toBeGreaterThan(0);
    const secondNotificationsNo = await sendUserNotifications();
    expect(secondNotificationsNo).toBe(0);
  });

  it('Should send a notification only when the user is subscribed to email notifications', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken({
      email: `${Math.random()}@charmversetest.io`
    });

    await generateProposal({
      proposalStatus: 'discussion',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    await updateUserProfile(user.id, { emailNotifications: false });

    const notificationsNo = await sendUserNotifications();
    expect(notificationsNo).toBe(0);

    await updateUserProfile(user.id, { emailNotifications: true });

    const secondNotificationsNo = await sendUserNotifications();
    expect(secondNotificationsNo).toBeGreaterThan(0);
  });
});
