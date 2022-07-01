/* eslint-disable no-console */
import { prisma } from 'db';
import { addBountyPermissionGroup } from 'lib/permissions/bounties/addBountyPermissionGroup';
import { hasAccessToSpace } from '../lib/middleware';

export const placeholder = 2;

const concurrent = 5;

export async function migrateBountyReviewers (skip: number, total?: number, errorsFound: number = 0): Promise<true> {

  if (total === undefined) {
    total = await prisma.bounty.count({
      where: {
        reviewer: {
          not: null
        }
      }
    });
  }

  if (skip >= total) {
    return true;
  }

  const bounties = await prisma.bounty.findMany({
    skip,
    take: concurrent,
    where: {
      reviewer: {
        not: null
      }
    }
  });

  console.log('Processing bounties ', skip + 1, '-', Math.min(skip + 1 + concurrent, total), ' / ', total);

  const errors: any[] = [];

  await Promise.all(bounties.map(async b => {

    return addBountyPermissionGroup({
      assignee: {
        group: 'user',
        id: b.reviewer as string
      },
      level: 'reviewer',
      resourceId: b.id
    })
      .catch(err => {
        console.log(err.errorType, err.errorConstructor);
        errors.push(err);
      }).then((val) => val);
  }));

  console.log(errors.length);

  const newErrorTotal = errorsFound + errors.length;
  console.log('Total errors', newErrorTotal, ' / ', total);

  return migrateBountyReviewers(skip + concurrent, total, errorsFound + errors.length);

}

