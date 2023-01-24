import { prisma } from 'db';
import { fancyTrim } from 'lib/utilities/strings';

const spaceDomain = 'charmverse';
const pagePath = 'page-24404801619516814';
const maxContentSize = 100;

async function exec () {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      domain: spaceDomain
    }
  });

  const users = await prisma.user.findMany({
    where: {
      spaceRoles: {
        some: {
          spaceId: space.id
        }
      }
    }
  });

  const usernameMap = users.reduce<Record<string, string>>((acc, user) => {
    acc[user.id] = user.username;
    return acc;
  }, {});

  const page = await prisma.page.findFirstOrThrow({
    where: {
      path: pagePath,
      spaceId: space.id
    },
    include: {
      diffs: true
    }
  });

  console.log('------------------------------------');
  console.log('Page History: ' + page.title);
  console.log('------------------------------------');
  const tableData = page.diffs.slice(0, 100).map((diff) => ({
    date: diff.createdAt.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'long' }),
    user: usernameMap[diff.createdBy],
    version: diff.version,
    // @ts-ignore
    'client V': diff.data.c,
    // @ts-ignore
    'server V': diff.data.s,
    // @ts-ignore
    stepType: diff.data.ds[0]?.stepType,
    // @ts-ignore
    content: diff.data.ds.map(ds => fancyTrim(JSON.stringify(ds.slice || ds.mark), maxContentSize)).join(' | ')
  }))
  .reduce<Record<string, any>>((acc, { version, ...row }) => {
    acc[version] = row;
    return acc;
  }, {});

  console.table(tableData)

}


exec();