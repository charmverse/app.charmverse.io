// TODO: [bounties-cleanup]// import type { Space, User } from '@charmverse/core/prisma';

// import { generateBounty, generateRole } from '@packages/testing/setupDatabase';

// import { generateUserAndSpace } from '../utils/mocks';
// import { login } from '../utils/session';
// import { test, expect } from '../utils/test';

// test.describe('Make a bounties page public and visit it', async () => {
//   test('visit a public bounty page', async ({ bountyBoardPage, documentPage }) => {
//     const page = bountyBoardPage.page;

//     const { role, space, bounty } = await createMockData();

//     // Act

//     await bountyBoardPage.goToBountyBoard(space.domain);

//     // 5. Make sure page is displayed using public layout
//     await expect(bountyBoardPage.publicLayout).toBeVisible();

//     // Make sure bounty property reviewer role is visible
//     await bountyBoardPage.goToView('all');
//     await expect(bountyBoardPage.allBountiesLayout).toBeVisible();

//     const bountyCard = page.locator(`data-test=bounty-card-${bounty.id}`);

//     await expect(bountyCard).toBeVisible();

//     await bountyCard.click();

//     // 4. Open the card and make sure it renders content
//     await page.waitForURL(/bountyId=/);

//     const cardPopup = page.locator('div.Dialog');

//     await expect(cardPopup).toBeVisible();

//     await expect(documentPage.documentTitle).toBeVisible();
//     await expect(documentPage.joinSpaceButton).toBeVisible();

//     // Make sure bounty property reviewer role is visible
//     const roleChip = page.getByText(role.name);
//     await expect(roleChip).toBeVisible();
//   });

//   test('visit shared bounties page as logged in user', async ({ bountyBoardPage }) => {
//     const { user, space, bounty } = await createMockData();
//     const page = bountyBoardPage.page;
//     await login({ userId: user.id, page });

//     // 1. Visit the page
//     await bountyBoardPage.goToBountyBoard(space.domain);

//     // 2. Make sure the board renders
//     const bountyCard = page.locator(`data-test=bounty-card-${bounty.id}`);

//     await expect(bountyCard).toBeVisible();

//     // 3. Make sure page is displayed using space layout
//     await expect(bountyBoardPage.loggedInLayout).toBeVisible();
//   });
// });

// async function createMockData() {
//   const { space, user } = await generateUserAndSpace({
//     publicBountyBoard: true
//   });
//   const roleName = 'Bounty Reviewer Role';

//   const role = await generateRole({
//     spaceId: space.id,
//     createdBy: user.id,
//     roleName
//   });
//   const bounty = await generateBounty({
//     spaceId: space.id,
//     createdBy: space.createdBy,
//     status: 'open',
//     approveSubmitters: false,
//     rewardAmount: 100,
//     rewardToken: 'ETH',
//     bountyPermissions: {
//       submitter: [
//         {
//           group: 'space',
//           id: space.id
//         }
//       ],
//       reviewer: [
//         {
//           group: 'role',
//           id: role.id
//         }
//       ]
//     },
//     pagePermissions: [
//       {
//         permissionLevel: 'view',
//         spaceId: space.id
//       },
//       {
//         permissionLevel: 'view',
//         public: true
//       }
//     ]
//   });
//   return { space, user, role, bounty };
// }

export {};
