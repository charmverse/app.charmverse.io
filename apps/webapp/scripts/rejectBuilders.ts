import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

import { getCommitsByUser } from '@packages/github/getCommitsByUser';

const afterDate = DateTime.utc().minus({ months: 3 }).toJSDate();

async function query() {
  const scouts = await prisma.scout.findMany({ where: { builderStatus: 'applied' }, include: { githubUsers: true } });
  console.log(scouts.length);
  let rejected = 0;
  for (const scout of scouts) {
    const commits = await getCommitsByUser({ login: scout.githubUsers[0].login, after: afterDate });
    console.log(commits.length);
    if (commits.length === 0) {
      await prisma.scout.update({ where: { id: scout.id }, data: { builderStatus: 'rejected' } });
      rejected++;
      console.log(`Rejected ${scout.githubUsers[0].login}`);
    } else {
      // console.log(`Accepted ${scout.githubUsers[0].login}`);
    }
  }
  console.log(`Rejected ${rejected} scouts`);
}

query();
