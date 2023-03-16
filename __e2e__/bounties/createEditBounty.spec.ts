import { test as base, expect } from '@playwright/test';
import type { Bounty, Space, User } from '@prisma/client';
import { BountyBoardPage } from '__e2e__/po/bountyBoard.po';
import { BountyPage } from '__e2e__/po/bountyPage.po';
import type { PageHeader } from '__e2e__/po/pageHeader.po';
import { createUser, createUserAndSpace, generateSpaceRole } from '__e2e__/utils/mocks';
import { login } from '__e2e__/utils/session';

import { prisma } from 'db';
import { createApplication } from 'lib/applications/actions';
import { randomETHWalletAddress } from 'testing/generateStubs';
import { generateSpaceUser } from 'testing/setupDatabase';

type Fixtures = {
  bountyBoardPage: BountyBoardPage;
  bountyPage: BountyPage;
  pageHeader: PageHeader;
};
let space: Space;
let adminUser: User;
let bounty: Bounty & { page: { path?: string; comments?: { id?: string }[] } | null };

// This will be used in the test to update the bounty and check the displayed value
const newBountyAmount = '123';

const test = base.extend<Fixtures>({
  bountyBoardPage: ({ page }, use) => use(new BountyBoardPage(page)),
  bountyPage: ({ page }, use) => use(new BountyPage(page))
});
test.describe.serial('Create and Edit Bounty', () => {
  test('create bounty and edit bounty', async ({ bountyBoardPage, page, bountyPage }) => {
    const generated = await createUserAndSpace({
      browserPage: page
    });

    space = generated.space;
    adminUser = generated.user;

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
      },
      include: {
        page: {
          select: {
            path: true
          }
        }
      }
    });

    await expect(bountyPage.bountyPropertiesConfiguration).toBeVisible();
    await expect(bountyPage.bountyPropertyAmount).toBeVisible();

    // Make sure the creator cannot see an applicant form for their own bounty
    await expect(bountyPage.bountyApplicantForm).not.toBeVisible();

    // A random amount which won't be the default

    await bountyPage.bountyPropertyAmount.fill(newBountyAmount);

    // Go to the bounty
    await bountyPage.openAsPageButton.click();

    await bountyPage.waitForDocumentPage({
      domain: space.domain,
      path: `${bounty.page?.path}`
    });

    await expect(bountyPage.bountyHeaderAmount).toBeVisible();

    await expect(bountyPage.bountyHeaderAmount).toHaveText(newBountyAmount);
  });

  test('space member can view and apply to the bounty', async ({ page, bountyBoardPage, bountyPage }) => {
    const user = await createUser({
      address: randomETHWalletAddress(),
      browserPage: page
    });

    await generateSpaceRole({
      spaceId: space.id,
      userId: user.id,
      isAdmin: false
    });

    await login({
      page,
      userId: user.id
    });

    await bountyBoardPage.goToBountyBoard(space.domain);

    const bountyCard = bountyBoardPage.getBountyCardLocator(bounty.id);
    await expect(bountyCard).toBeVisible();

    //    await page.pause();

    await bountyCard.click();

    await expect(bountyPage.dialog).toBeVisible();

    // User shouldn't see the bounty configuration, but should see the apply option
    await expect(bountyPage.bountyPropertiesConfiguration).not.toBeVisible();
    await expect(bountyPage.bountyHeaderAmount).toBeVisible();
    await expect(bountyPage.bountyHeaderAmount).toHaveText(newBountyAmount);
    await expect(bountyPage.bountyApplicantForm).toBeVisible();
  });

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
      },
      include: {
        page: {
          select: {
            path: true
          }
        }
      }
    });

    // Another user is applying to the bounty
    await createApplication({
      bountyId: bounty.id,
      message: 'My application message',
      userId: extraUser.id
    });

    // Give time for application to be created
    await page.waitForTimeout(1000);

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
    await expect(page.getByText('My new comment')).toBeVisible();

    // Give time for coment to be created
    await page.waitForTimeout(1000);

    bounty = await prisma.bounty.findFirstOrThrow({
      where: {
        id: bounty.id
      },
      include: {
        page: {
          select: {
            path: true,
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
