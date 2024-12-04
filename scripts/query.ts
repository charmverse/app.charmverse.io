import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';
import { DateTime } from 'luxon';

import { getCommitsByUser } from '@packages/github/getCommitsByUser';
const afterDate = DateTime.utc().minus({ months: 3 }).toJSDate();
const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 30 }, { zone: 'utc' }); // Actual launch: 2024-W40
const currentSeason = currentSeasonStartDate.toFormat(`kkkk-'W'WW`);

async function query() {
  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      space: {
        domain: 'op-grants'
      },
      page: {
        path: 'pike-unlocking-the-multichain-utility-of-op-10175721236250412'
      }
    },
    include: {
      authors: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      }
    }
  });

  const user = await prisma.user.findMany({
    where: {
      OR: [
        {
          email: 'terry@nuts.finance'
        },
        {
          verifiedEmails: {
            some: {
              email: 'terry@nuts.finance'
            }
          }
        },
        {
          googleAccounts: {
            some: {
              email: 'terry@nuts.finance'
            }
          }
        }
      ]
    }
  });

  prettyPrint({proposal});
}

query();
