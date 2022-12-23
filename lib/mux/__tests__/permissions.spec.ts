import { createUserFromWallet } from 'lib/users/createUser';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateForumPost } from 'testing/utils/forums';

import { canView, canCreate } from '../permissions';

const users: Record<string, string> = {};
let pageId: string;

beforeAll(async () => {
  const { user, space } = await generateUserAndSpaceWithApiToken(undefined, true);
  const page = await generateForumPost({ spaceId: space.id, userId: user.id });
  pageId = page.id;
  users.member = user.id;
  users.nonMember = (await createUserFromWallet()).id;
});

describe('Video Permissions', () => {
  it('Checks that a user can view a page video', async () => {
    const isAllowed = await canView({ userId: users.member, pageId });

    expect(isAllowed).toBe(true);
  });

  it('Checks that a user cannot view a page video', async () => {
    const isAllowed = await canView({ userId: users.nonMember, pageId });

    expect(isAllowed).toBe(false);
  });

  it('Checks that a user can create a page video', async () => {
    const isAllowed = await canCreate({ userId: users.member, pageId });

    expect(isAllowed).toBe(true);
  });

  it('Checks that a user cannot create a page video', async () => {
    const isAllowed = await canCreate({ userId: users.nonMember, pageId });

    expect(isAllowed).toBe(false);
  });
});
