// TODO: [bounties-cleanup]// import type { Space, User } from '@charmverse/core/prisma';

// import type { Bounty, Space, User } from '@charmverse/core/prisma';
// import { prisma } from '@charmverse/core/prisma-client';
// import { expect } from '@playwright/test';
// import { BountyBoardPage } from '__e2e__/po/bountyBoard.po';
// import { BountyPage } from '__e2e__/po/bountyPage.po';
// import type { PageHeader } from '__e2e__/po/pageHeader.po';
// import { createUser, createUserAndSpace, generateSpaceRole } from '__e2e__/utils/mocks';
// import { login } from '__e2e__/utils/session';

// import { randomETHWalletAddress } from '@packages/testing/generateStubs';

// type Fixtures = {
//   bountyBoardPage: BountyBoardPage;
//   bountyPage: BountyPage;
//   pageHeader: PageHeader;
// };
// let space: Space;
// let adminUser: User;
// let bountyId: string;

// // This will be used in the test to update the bounty and check the displayed value
// const newBountyAmount = '123';

// const test = base.extend<Fixtures>({
//   bountyBoardPage: ({ page }, use) => use(new BountyBoardPage(page)),
//   bountyPage: ({ page }, use) => use(new BountyPage(page))
// });
// test.describe.serial('Create and Edit Bounty', () => {
//   test('create bounty and edit bounty', async ({ bountyBoardPage, page, bountyPage }) => {
//     const generated = await createUserAndSpace({
//       browserPage: page
//     });

//     space = generated.space;
//     adminUser = generated.user;

//     await login({ page, userId: adminUser.id });

//     await bountyBoardPage.goToBountyBoard(space.domain);

//     await expect(bountyBoardPage.createBountyButton).toBeVisible();

//     await bountyBoardPage.createBountyButton.click();

//     await bountyBoardPage.waitForModal();

//     // There should be only 1 bounty in the space
//     const bounty = await prisma.bounty.findFirstOrThrow({
//       where: {
//         spaceId: space.id
//       },
//       include: {
//         page: {
//           select: {
//             path: true
//           }
//         }
//       }
//     });

//     bountyId = bounty.id;

//     await expect(bountyPage.bountyPropertiesConfiguration).toBeVisible();
//     await expect(bountyPage.bountyPropertyAmount).toBeVisible();

//     // Make sure the creator cannot see an applicant form for their own bounty
//     await expect(bountyPage.bountyApplicantForm).not.toBeVisible();

//     // A random amount which won't be the default

//     await bountyPage.bountyPropertyAmount.fill(newBountyAmount);

//     // Go to the bounty
//     await bountyPage.openAsPageButton.click();

//     await bountyPage.waitForDocumentPage({
//       domain: space.domain,
//       path: `${bounty.page?.path}`
//     });

//     await expect(bountyPage.bountyHeaderAmount).toBeVisible();

//     await expect(bountyPage.bountyHeaderAmount).toHaveText(newBountyAmount);
//   });

//   test('space member can view and apply to the bounty', async ({ page, bountyBoardPage, bountyPage }) => {
//     const user = await createUser({
//       address: randomETHWalletAddress(),
//       browserPage: page
//     });

//     await generateSpaceRole({
//       spaceId: space.id,
//       userId: user.id,
//       isAdmin: false
//     });

//     await login({
//       page,
//       userId: user.id
//     });

//     await bountyBoardPage.goToBountyBoard(space.domain);

//     const bountyCard = bountyBoardPage.getBountyCardLocator(bountyId);
//     await expect(bountyCard).toBeVisible();

//     //    await page.pause();

//     await bountyCard.click();

//     await expect(bountyPage.dialog).toBeVisible();

//     // User shouldn't see the bounty configuration, but should see the apply option
//     await expect(bountyPage.bountyHeaderAmount).toBeVisible();
//     await expect(bountyPage.bountyHeaderAmount).toHaveText(newBountyAmount);
//     await expect(bountyPage.bountyApplicantForm).toBeVisible();
//   });
// });

export {};
