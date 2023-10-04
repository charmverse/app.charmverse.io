import { generateUser } from 'testing/utils/users';

import { isGroupEnabledForUser } from '../notificationRules';

describe('Notification Rules: isGroupEnabledForUser()', () => {
  it('Returns true', () => {});
  it('Returns false', async () => {
    const user = await generateUser({
      notificationRules: [{ exclude: 'rewards' }]
    });
  });
});
