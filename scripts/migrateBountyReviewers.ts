/* eslint-disable no-console */
import { prisma } from 'db';
import { addBountyPermissionGroup } from 'lib/permissions/bounties/addBountyPermissionGroup';

export const placeholder = 2;

const concurrent = 5;

export async function migrateBountyReviewers (skip: number, total?: number): Promise<true> {

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
    where: {
      reviewer: {
        not: null
      }
    }
  });

  console.log('Processing bounties ', skip + 1, '-', Math.min(skip + 1 + concurrent, total), ' / ', total);

  const errors: any[] = [];

  await Promise.all(bounties.map(async b => {
    console.log(b);

    console.log(await prisma.user.findUnique({ where: { id: b.reviewer as string } }));

    return addBountyPermissionGroup({
      assignee: {
        group: 'user',
        id: b.reviewer as string
      },
      level: 'reviewer',
      resourceId: b.id
    })
      .catch(err => {
        console.log(err);
        errors.push(err);
      }).then((val) => val);
  }));

  console.log(errors);

  return migrateBountyReviewers(skip + concurrent, total);

}

