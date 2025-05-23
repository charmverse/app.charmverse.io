// TODO: [bounties-cleanup]// import type { Space, User } from '@charmverse/core/prisma';
// import { prisma } from '@charmverse/core/prisma-client';
// import { expect } from '@playwright/test';
// import type { BountyBoardPage } from '__e2e__/po/bountyBoard.po';
// import { BountyPage } from '__e2e__/po/bountyPage.po';
// import type { PageHeader } from '__e2e__/po/pageHeader.po';
// import { createUserAndSpace } from '__e2e__/utils/mocks';
// import { login } from '__e2e__/utils/session';

// import { baseUrl } from '@packages/config/constants';
// import { createApplication } from '@packages/lib/applications/actions';
// import { createBounty } from '@packages/lib/bounties';
// import { generateSpaceUser } from '@packages/testing/setupDatabase';

// type Fixtures = {
//   bountyBoardPage: BountyBoardPage;
//   bountyPage: BountyPage;
//   pageHeader: PageHeader;
// };
// let space: Space;
// let adminUser: User;
// const test = base.extend<Fixtures>({
//   bountyPage: ({ page }, use) => use(new BountyPage(page))
// });
// test.describe('Create and Edit Bounty', () => {
//   test('send a message to the bounty applicant', async ({ page, bountyPage }) => {
//     const generated = await createUserAndSpace({
//       browserPage: page
//     });

//     space = generated.space;
//     adminUser = generated.user;
//     const extraUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
//     const bounty = await createBounty({
//       spaceId: space.id,
//       createdBy: adminUser.id,
//       status: 'open',
//       rewardAmount: 1
//     });

//     // Another user is applying for the bounty
//     await createApplication({
//       bountyId: bounty.id,
//       message: 'My application message',
//       userId: extraUser.id
//     });

//     await login({ page, userId: adminUser.id });

//     await bountyPage.page.goto(`${baseUrl}/${space.domain}/${bounty.page.path}`);

//     // Review button appears and the reviewer is clicking it
//     await expect(bountyPage.bountyReviewButton).toBeVisible();
//     await bountyPage.bountyReviewButton.click();

//     // The comment area is empty and the comment button is disabled
//     expect((await bountyPage.bountyCommentArea.innerText()).valueOf().trim()).toBe('');
//     await expect(bountyPage.bountyCommentButton).toBeDisabled();

//     // If the user types and removes what he typed, the comment button should be disabled
//     await bountyPage.bountyCommentArea.click();
//     await page.keyboard.type('New', { delay: 100 });
//     await page.keyboard.press('Backspace');
//     await page.keyboard.press('Backspace');
//     await page.keyboard.press('Backspace');
//     await expect(bountyPage.bountyCommentButton).toBeDisabled();

//     // Comment is saved and is visible
//     await expect(bountyPage.bountyCommentArea).toBeVisible();
//     await bountyPage.bountyCommentArea.click();
//     await page.keyboard.type('My new comment', { delay: 100 });
//     await bountyPage.bountyCommentButton.click();

//     // Give time for coment to be created
//     await page.waitForTimeout(1000);
//     await expect(page.getByText('My new comment')).toBeVisible();

//     const updatedBounty = await prisma.bounty.findFirstOrThrow({
//       where: {
//         id: bounty.id
//       },
//       include: {
//         page: {
//           select: {
//             comments: {
//               select: {
//                 id: true
//               }
//             }
//           }
//         }
//       }
//     });

//     const firstCommentId = updatedBounty.page?.comments?.[0]?.id || '';

//     expect(firstCommentId).not.toBe('');

//     // Edit a comment
//     await bountyPage.getCommentMenuIcon(firstCommentId).hover();
//     expect(bountyPage.getCommentMenuIcon(firstCommentId)).toBeVisible();
//     await bountyPage.getCommentMenuIcon(firstCommentId).click();
//     await bountyPage.getEditCommentButton(firstCommentId).click();
//     await bountyPage.getEditCommentArea(firstCommentId).click();
//     await page.keyboard.press('Control+A'); // linux/windows
//     await page.keyboard.press('Meta+A'); // macOs
//     await page.keyboard.press('Backspace');
//     await expect(bountyPage.getSaveCommentButton(firstCommentId)).toBeDisabled();
//     await page.keyboard.type('Second comment', { delay: 100 });
//     await bountyPage.getSaveCommentButton(firstCommentId).click();
//     await expect(page.getByText('Second comment')).toBeVisible();
//   });
// });

export {};
