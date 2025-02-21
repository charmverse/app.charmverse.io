import { testUtilsPages } from '@charmverse/core/test';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { updateUserProfile } from '@packages/users/updateUserProfile';
import { saveDocumentNotification } from '@root/lib/notifications/saveNotification';
import { builders } from '@root/lib/prosemirror/builders';
import { v4 } from 'uuid';

afterEach(() => {
  jest.resetModules();
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe.skip('sendNotificationEmail()', () => {
  it('Should send a notification email', async () => {
    const { user, space } = await generateUserAndSpace({
      user: { email: `${Math.random()}@charmversetest.io` }
    });

    const sendEmailMock = jest.fn();
    jest.mock('lib/mailer', () => ({
      sendEmail: sendEmailMock
    }));

    const { sendNotificationEmail } = await import('../sendNotificationEmail');

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

    await sendNotificationEmail({ id: notification.id, type: 'documents' });
    expect(sendEmailMock).toHaveBeenCalled();
  });

  it('Should send a notification only when the user is subscribed to email notifications', async () => {
    const { user, space } = await generateUserAndSpace({
      user: { email: `${Math.random()}@charmversetest.io`, emailNotifications: false }
    });

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const sendEmailMock = jest.fn();
    jest.mock('lib/mailer', () => ({
      sendEmail: sendEmailMock
    }));

    const { sendNotificationEmail } = await import('../sendNotificationEmail');

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

    await sendNotificationEmail({ id: notification.id, type: 'documents' });
    expect(sendEmailMock).not.toHaveBeenCalled();

    await updateUserProfile(user.id, { emailNotifications: true });

    await sendNotificationEmail({ id: notification.id, type: 'documents' });
    expect(sendEmailMock).toHaveBeenCalled();
  });
});
