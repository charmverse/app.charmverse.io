import { testUtilsPages } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { saveDocumentNotification } from 'lib/notifications/saveNotification';
import { updateUserProfile } from 'lib/users/updateUserProfile';
import { builders } from 'testing/prosemirror/builders';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { sendUserNotifications } from '../sendNotifications';

describe('sendNotification()', () => {
  it('Should send a notification email only once', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken({
      email: `${Math.random()}@charmversetest.io`
    });

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    await saveDocumentNotification({
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      pageId: page.id,
      spaceId: space.id,
      type: 'mention.created',
      mentionId: v4(),
      userId: user.id,
      content: builders.doc(builders.p('Test')).toJSON()
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

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    await saveDocumentNotification({
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      pageId: page.id,
      spaceId: space.id,
      type: 'mention.created',
      mentionId: v4(),
      userId: user.id,
      content: builders.doc(builders.p('Test')).toJSON()
    });

    await updateUserProfile(user.id, { emailNotifications: false });

    const notificationsNo = await sendUserNotifications();
    expect(notificationsNo).toBe(0);

    await updateUserProfile(user.id, { emailNotifications: true });

    const secondNotificationsNo = await sendUserNotifications();
    expect(secondNotificationsNo).toBeGreaterThan(0);
  });
});
