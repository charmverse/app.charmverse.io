// import { prisma } from 'db';
// import { addBountyPermissionGroup } from 'lib/permissions/bounties/addBountyPermissionGroup';

// const concurrent = 5;

// async function migrateBountyReviewers (skip: number, total?: number): Promise<true> {

//   if (total === undefined) {
//     total = await prisma.bounty.count({
//       where: {
//         reviewer: {
//           not: null
//         }
//       }
//     });
//   }

//   if (skip >= total) {
//     return true;
//   }

//   const bounties = await prisma.bounty.findMany({
//     skip,
//     where: {
//       reviewer: {
//         not: null
//       }
//     }
//   });

//   console.log('Processing bounties ', skip + 1, '-', skip + 1 + concurrent, ' / ', total);

//   await Promise.all(bounties.map(b => addBountyPermissionGroup({
//     assignee: {
//       group: 'user',
//       id: b.reviewer as string
//     },
//     level: 'reviewer',
//     resourceId: b.id
//   })));

//   return migrateBountyReviewers(skip + concurrent, total);

// }

// migrateBountyReviewers(0)
//   .then(() => {
//     console.log('Completed work');
//   });
