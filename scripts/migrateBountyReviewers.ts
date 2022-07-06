/* eslint-disable no-console */
import { prisma } from 'db';
import { setBountyPermissions } from 'lib/permissions/bounties/setBountyPermissions';
import { hasAccessToSpace } from '../lib/middleware';
import { addBountyPermissionGroup } from '../lib/permissions/bounties';

export const placeholder = 2;

const concurrent = 5;

export async function migrateBountyReviewers (skip: number, total?: number, errorsFound: any[] = []): Promise<true> {
  // Added as script body references old schema and would cause build errors if not commented out
  return Promise.resolve(true);

  // if (total === undefined) {
  //   total = await prisma.bounty.count({
  //     where: {
  //       reviewer: {
  //         not: null
  //       }
  //     }
  //   });
  // }

  // if (skip >= total) {
  //   console.log(errorsFound);
  //   console.log('All errors: ', errorsFound.length);
  //   return true;
  // }

  // const bounties = await prisma.bounty.findMany({
  //   skip,
  //   take: concurrent,
  //   where: {
  //     reviewer: {
  //       not: null
  //     }
  //   }
  // });

  // console.log('Processing bounties ', skip + 1, '-', Math.min(skip + 1 + concurrent, total), ' / ', total);

  // const errors: any[] = [];

  // await Promise.all(bounties.map(async b => {

  //   try {
  //     await addBountyPermissionGroup({
  //       assignee: {
  //         group: 'space',
  //         id: b.spaceId
  //       },
  //       level: 'submitter',
  //       resourceId: b.id
  //     });
  //     await addBountyPermissionGroup({
  //       assignee: {
  //         group: 'user',
  //         id: b.reviewer as string
  //       },
  //       level: 'reviewer',
  //       resourceId: b.id
  //     });
  //     return true;
  //   }
  //   catch (err: any) {
  //     console.log(err.errorType, err.errorConstructor);
  //     errors.push({
  //       bountyId: b.id,
  //       reviewer: b.reviewer,
  //       reason: err.message
  //     });
  //     return true;

  //   }
  // }));

  // const newErrorTotal = errorsFound.length + errors.length;
  // errorsFound.push(...errors);

  // console.log('Total errors', newErrorTotal, ' / ', total);

  // return migrateBountyReviewers(skip + concurrent, total, errorsFound);

}

