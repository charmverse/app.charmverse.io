import type { Page, WorkspaceEvent } from '@charmverse/core/dist/prisma';
import type { Browser } from '@playwright/test';
import { chromium, expect, test } from '@playwright/test';
import { v4 } from 'uuid';

import { baseUrl } from 'config/constants';
import { upsertPermission } from 'lib/permissions/pages';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import { generateProposal, generateRole } from 'testing/setupDatabase';

import { generateUserAndSpace } from './utils/mocks';

let browser: Browser;

test.beforeAll(async () => {
  // Set headless to false in chromium.launch to visually debug the test
  browser = await chromium.launch();
});

test.describe.serial('Make a proposals page public and visit it', async () => {
  let proposal: Page & { proposal: ProposalWithUsers; workspaceEvent: WorkspaceEvent };

  test('visit a public proposal page', async () => {
    const userContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });

    const page = await userContext.newPage();

    const { space, user } = await generateUserAndSpace({
      publicBountyBoard: true
    });

    //    await logout({ page });

    const roleName = 'Proposal Reviewer Role';

    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id,
      roleName
    });

    const title = `Proposal ${v4()}`;

    proposal = await generateProposal({
      spaceId: space.id,
      proposalStatus: 'draft',
      reviewers: [
        {
          group: 'role',
          id: role.id
        }
      ],
      authors: [user.id],
      userId: user.id,
      title
    });

    await upsertPermission(proposal.id, {
      // Can only toggle public
      permissionLevel: 'view',
      public: true
    });

    // Act

    await page.goto(`${baseUrl}/${space.domain}/${proposal.path}`);

    // Make sure proposal property reviewer role is visible
    const titleLocator = await page.locator('data-test=editor-page-title');

    await expect(titleLocator).toBeVisible();
    await expect(titleLocator).toHaveText(title);

    // Uncomment when bug is fixed
    const roleChip = page.getByText(roleName);
    await expect(roleChip).toBeVisible();
  });
});
