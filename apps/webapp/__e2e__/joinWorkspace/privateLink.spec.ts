import { baseUrl } from '@packages/config/constants';
import { createInviteLink } from '@packages/lib/invites/createInviteLink';
import { test as base } from '@playwright/test';
import { AcceptInvitePage } from '__e2e__/po/inviteLink.po';
import { login } from '__e2e__/utils/session';

import { test } from '../testWithFixtures';
import { generateUser, generateUserAndSpace } from '../utils/mocks';

test('private invite link - accepting invite sends user your space', async ({ page, acceptInvitePage }) => {
  const { space, user: spaceUser } = await generateUserAndSpace();
  const user = await generateUser();

  const inviteLink = await createInviteLink({
    createdBy: spaceUser.id,
    spaceId: space.id
  });

  await login({ userId: user.id, page });

  const invitePath = `/invite/${inviteLink.code}`;

  await page.goto(`${baseUrl}${invitePath}`);
  await acceptInvitePage.acceptInviteButton.click();

  await acceptInvitePage.waitForWorkspaceLoaded({
    domain: space.domain
  });
});
