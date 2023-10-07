import { generateUser } from 'testing/utils/users';

describe('Notification Rules: isGroupEnabledForUser()', () => {
  it('Returns true', () => {});
  it('Returns false', async () => {
    const user = await generateUser({
      // notificationRules: { rewards: false }
    });
  });
});
