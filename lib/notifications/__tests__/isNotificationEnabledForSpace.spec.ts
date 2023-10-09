import { generateUser } from 'testing/utils/users';

describe('Notification Rules: isNotificationEnabledForSpace()', () => {
  it('Returns true', () => {});
  it('Returns false', async () => {
    const user = await generateUser({
      // notificationToggles: { rewards: false }
    });
  });
});
