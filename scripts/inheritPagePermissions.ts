import { prisma } from 'db';
// import { setupPermissionsAfterPageRepositioned } from 'lib/permissions/pages/triggers';
// import { IPageWithPermissions, PageNodeWithPermissions } from 'lib/pages/server';

// export async function recursiveRebuild (pageId: string | PageNodeWithPermissions, level = 0, sourcePageNumber = 0): Promise<true> {
//   await setupPermissionsAfterPageRepositioned(pageId);

//   const idToPass = typeof pageId === 'string' ? pageId : pageId.id;

//   const children = await prisma.page.findMany({
//     where: {
//       parentId: idToPass
//     },
//     select: {
//       permissions: {
//         include: {
//           sourcePermission: true
//         }
//       }
//     }
//   });

//   const parallelFactor = 10;

//   for (let i = 0; i < children.length; i += parallelFactor) {
//     await Promise.all(children.slice(i, i + parallelFactor).map((child, childIndex) => {
//       // console.log(`Processing root ${sourcePageNumber}, level ${level}, child ${i + childIndex + 1}`);
//       return recursiveRebuild(child, level + 1, sourcePageNumber);
//     }));
//   }

//   return true;

// }

// /**
//  * We will load root pages and traverse their respective trees
//  * @param cursor
//  */
// async function inheritPermissions (processed = 0, total = 0): Promise<true> {

//   // Only runs first time
//   if (total === 0) {
//     total = await prisma.page.count({
//       where: {
//         AND: [
//           {
//             parentId: null
//           },
//           {
//             spaceId: {
//               not: '0eae61ed-e2d9-4f26-b5fe-e403dad8ecd9'
//             }
//           },
//           {
//             spaceId: {
//               not: '5c3cc4fc-3313-4c22-a574-abbf9c4a63d8'
//             }
//           }
//         ]
//       }
//     });
//   }

//   const foundPages = await prisma.page.findMany({
//     take: 5,
//     skip: processed,
//     where: {
//       AND: [
//         {
//           parentId: null
//         },
//         {
//           spaceId: {
//             not: '0eae61ed-e2d9-4f26-b5fe-e403dad8ecd9'
//           }
//         },
//         {
//           spaceId: {
//             not: '5c3cc4fc-3313-4c22-a574-abbf9c4a63d8'
//           }
//         }
//       ]
//     },
//     orderBy: {
//       id: 'asc'
//     },
//     include: {
//       permissions: {
//         include: {
//           sourcePermission: true
//         }
//       }
//     }
//   });

//   if (foundPages.length === 0) {
//     return true;
//   }

//   // console.log('Processing page tree ', processed + 1, '-', processed + foundPages.length, ' / ', total);

//   await Promise.all(foundPages.map((page, index) => {

//     return recursiveRebuild(page, 0, processed + index + 1);
//   }));

//   return inheritPermissions(processed + foundPages.length, total);

// }

// /* Testing utility to delete all inheritance relationships
// prisma.pagePermission.updateMany({
//   data: {
//     inheritedFromPermission: null
//   }
// }).then(() => {
//   // console.log('Inheritance deleted');
// });
// */

// /* Run this function
// prisma.$connect()
//   .then(() => {
//     // console.log('Connected to DB');
//     inheritPermissions(0)
//       .then(() => {
//         // console.log('Success');
//       });
//   });

// */
