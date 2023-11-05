import type { Space, User } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';

import type { InviteLinkInput } from '../createInviteLink';
import { createInviteLink } from '../createInviteLink';

let space: Space;

let user: User;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({});
  space = generated.space;
  user = generated.user;
});

describe('createInviteLink', () => {
  it('should create a link', async () => {
    const input: InviteLinkInput = {
      createdBy: user.id,
      spaceId: space.id,
      maxAgeMinutes: 60,
      maxUses: 10
    };

    const link = await createInviteLink(input);

    expect(link).toMatchObject(input);
  });

  it('should create the link without an expiry date or max uses if a public context is provided', async () => {
    const input: InviteLinkInput = {
      createdBy: user.id,
      spaceId: space.id,
      maxAgeMinutes: 60,
      maxUses: 10,
      visibleOn: 'proposals'
    };

    const link = await createInviteLink(input);

    expect(link).toMatchObject({
      ...input,
      maxAgeMinutes: -1,
      maxUses: -1
    });
  });
});
