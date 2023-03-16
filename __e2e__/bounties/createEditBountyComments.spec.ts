import { test as base, expect } from '@playwright/test';
import type { Bounty, Space, User } from '@prisma/client';
import { BountyBoardPage } from '__e2e__/po/bountyBoard.po';
import { BountyPage } from '__e2e__/po/bountyPage.po';
import type { PageHeader } from '__e2e__/po/pageHeader.po';
import { createUserAndSpace } from '__e2e__/utils/mocks';
import { login } from '__e2e__/utils/session';

import { prisma } from 'db';
import { createApplication } from 'lib/applications/actions';
import { generateSpaceUser } from 'testing/setupDatabase';

type Fixtures = {
  bountyBoardPage: BountyBoardPage;
  bountyPage: BountyPage;
  pageHeader: PageHeader;
};
let space: Space;
let adminUser: User;
let bounty: Bounty & { page?: { comments?: { id?: string }[] } | null };

const test = base.extend<Fixtures>({
  bountyBoardPage: ({ page }, use) => use(new BountyBoardPage(page)),
  bountyPage: ({ page }, use) => use(new BountyPage(page))
});
test.describe.serial('Create and Edit Bounty', () => {
  test('send a message to the bounty applicant', async ({ bountyBoardPage, page, bountyPage }) => {
    const generated = await createUserAndSpace({
      browserPage: page
    });

    space = generated.space;
    adminUser = generated.user;
    const extraUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

    await login({ page, userId: adminUser.id });

    await bountyBoardPage.goToBountyBoard(space.domain);

    await expect(bountyBoardPage.createBountyButton).toBeVisible();

    await bountyBoardPage.createBountyButton.click();

    // Give time for bounty to create
    await page.waitForTimeout(1000);

    // There should be only 1 bounty in the space
    bounty = await prisma.bounty.findFirstOrThrow({
      where: {
        spaceId: space.id
      }
    });

    // Another user is applying for the bounty
    await createApplication({
      bountyId: bounty.id,
      message: 'My application message',
      userId: extraUser.id
    });

    // Need to close and open the modal again to see the new application
    await page.locator('data-test=close-dialog').click();
    await page.locator(`data-test=bounty-card-${bounty.id}`).click();

    // Review button appears and the reviewer is clicking it
    await expect(bountyPage.bountyReviewButton).toBeVisible();
    await bountyPage.bountyReviewButton.click();

    // The comment area is empty and the comment button is disabled
    expect((await bountyPage.bountyCommentArea.innerText()).valueOf().trim()).toBe('');
    await expect(bountyPage.bountyCommentButton).toBeDisabled();

    // If the user types and removes what he typed, the comment button should be disabled
    await bountyPage.bountyCommentArea.click();
    await page.keyboard.type('New', { delay: 100 });
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await expect(bountyPage.bountyCommentButton).toBeDisabled();

    // Comment is saved and is visible
    await expect(bountyPage.bountyCommentArea).toBeVisible();
    await bountyPage.bountyCommentArea.click();
    await page.keyboard.type('My new comment', { delay: 100 });
    await bountyPage.bountyCommentButton.click();

    // Give time for coment to be created
    await page.waitForTimeout(1000);
    await expect(page.getByText('My new comment')).toBeVisible();

    bounty = await prisma.bounty.findFirstOrThrow({
      where: {
        id: bounty.id
      },
      include: {
        page: {
          select: {
            comments: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    const firstCommentId = bounty.page?.comments?.[0]?.id || '';

    // Edit a comment
    await bountyPage.getCommentMenuIcon(firstCommentId).hover();
    expect(bountyPage.getCommentMenuIcon(firstCommentId)).toBeVisible();
    await bountyPage.getCommentMenuIcon(firstCommentId).click();
    await bountyPage.getEditCommentButton(firstCommentId).click();
    await bountyPage.getEditCommentArea(firstCommentId).click();
    await page.keyboard.press('Meta+A');
    await page.keyboard.press('Backspace');
    await expect(bountyPage.getSaveCommentButton(firstCommentId)).toBeDisabled();
    await page.keyboard.type('Second comment', { delay: 100 });
    await bountyPage.getSaveCommentButton(firstCommentId).click();
    await expect(page.getByText('Second comment')).toBeVisible();
  });
});
