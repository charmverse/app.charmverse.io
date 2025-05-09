import { test as base } from '@playwright/test';
import { baseUrl } from '@packages/config/constants';
import { AcceptInvitePage } from '__e2e__/po/inviteLink.po';
import { login } from '__e2e__/utils/session';

import { createInviteLink } from '@packages/lib/invites/createInviteLink';

import { generateUser, generateUserAndSpace } from '../utils/mocks';

type Fixtures = {
  acceptInvitePage: AcceptInvitePage;
};

const test = base.extend<Fixtures>({
  acceptInvitePage: ({ page }, use) => use(new AcceptInvitePage(page))
});

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
