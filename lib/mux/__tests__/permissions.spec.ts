import { createUserWithWallet, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generateForumPost } from '@packages/testing/utils/forums';
import { randomETHWalletAddress } from '@packages/utils/blockchain';

import { canView, canCreate } from '../permissions';

const users: Record<string, string> = {};
let pageId: string;
let spaceId: string;

beforeAll(async () => {
  const { user, space } = await generateUserAndSpace({ isAdmin: true });
  const page = await generateForumPost({ spaceId: space.id, userId: user.id });
  pageId = page.id;
  spaceId = space.id;
  users.member = user.id;
  users.nonMember = (
    await createUserWithWallet({
      address: randomETHWalletAddress()
    })
  ).id;
});

describe('Video Permissions', () => {
  it('Checks that a user can view a page video', async () => {
    const isAllowed = await canView({ userId: users.member, resourceId: pageId, spaceId });

    expect(isAllowed).toBe(true);
  });

  it('Checks that a user cannot view a page video', async () => {
    const isAllowed = await canView({ userId: users.nonMember, resourceId: pageId, spaceId });

    expect(isAllowed).toBe(false);
  });

  it('Checks that a user can create a page video', async () => {
    const isAllowed = await canCreate({ userId: users.member, resourceId: pageId, spaceId });

    expect(isAllowed).toBe(true);
  });

  it('Checks that a user cannot create a page video', async () => {
    const isAllowed = await canCreate({ userId: users.nonMember, resourceId: pageId, spaceId });

    expect(isAllowed).toBe(false);
  });
});
