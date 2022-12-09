import { v4 as uuid } from 'uuid';

import { createApplication } from 'lib/applications/actions';
import { generateBounty, generateProposal, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { sendUserNotifications } from '../sendNotifications';

describe('sendNotification()', () => {
  it('Should send a notification email only once', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

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
});
