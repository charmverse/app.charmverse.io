import { chromium } from '@playwright/test';
import { LoggedInUser } from 'models';
import { baseUrl } from 'testing/mockApiCall';
import { v4 } from 'uuid';

// (async () => {
//   // ARRANGE
//   // Make sure to run headed.
//   const browser = await chromium.launch({ headless: false });

//   // Setup context however you like.
//   const context = await browser.newContext({ /* pass any options */ });
//   await context.route('**/*', route => route.continue());

//   // Pause the page, and start recording manually.
//   const page = await context.newPage();

//   const walletAddress = v4();

//   const profile: LoggedInUser = await (page.request.post(`${baseUrl}/api/profile`, {
//     data: {
//       address: walletAddress
//     }
//   }).then(res => res.json()));

//   const domain = `domain-${v4()}`;

//   await page.request.post(`${baseUrl}/api/spaces`, {
//     data: {
//       author: {
//         connect: {
//           id: profile.id
//         }
//       },
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       updatedBy: profile.id,
//       spaceRoles: {
//         create: [{
//           isAdmin: true,
//           user: {
//             connect: {
//               id: profile!.id
//             }
//           }
//         }]
//       },
//       domain,
//       name: 'Testing space'
//     }
//   });

//   // ACT

//   // ASSERT
//   page.goto(baseUrl as string);

//   await page.pause();
// })();
