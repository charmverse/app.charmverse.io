import { testUtilsPages } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { saveDocumentNotification } from 'lib/notifications/saveNotification';
import { builders } from 'lib/prosemirror/builders';
import { updateUserProfile } from 'lib/users/updateUserProfile';
import { generateUserAndSpace } from 'testing/setupDatabase';

import { sendNotificationEmail } from '../sendNotificationEmail';

describe('sendNotificationEmail()', () => {
  it('Should send a notification email', async () => {
    const { user, space } = await generateUserAndSpace({
      user: { email: `${Math.random()}@charmversetest.io` }
    });

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const notification = await saveDocumentNotification({
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      pageId: page.id,
      spaceId: space.id,
      type: 'mention.created',
      mentionId: v4(),
      userId: user.id,
      content: builders.doc(builders.p('Test')).toJSON()
    });

    const notificationsNo = await sendNotificationEmail({ id: notification.id, type: 'documents' });
    expect(notificationsNo).toBe(true);
  });

  it('Should send a notification only when the user is subscribed to email notifications', async () => {
    const { user, space } = await generateUserAndSpace({
      user: { email: `${Math.random()}@charmversetest.io`, emailNotifications: false }
    });

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const notification = await saveDocumentNotification({
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      pageId: page.id,
      spaceId: space.id,
      type: 'mention.created',
      mentionId: v4(),
      userId: user.id,
      content: builders.doc(builders.p('Test')).toJSON()
    });

    const notificationsNo = await sendNotificationEmail({ id: notification.id, type: 'documents' });
    expect(notificationsNo).toBe(false);

    await updateUserProfile(user.id, { emailNotifications: true });

    const secondNotificationsNo = await sendNotificationEmail({ id: notification.id, type: 'documents' });
    expect(secondNotificationsNo).toBe(true);
  });
});
