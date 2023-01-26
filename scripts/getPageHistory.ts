import { prisma } from 'db';
import { fancyTrim } from 'lib/utilities/strings';

const spaceDomain = 'charmverse';
const pagePath = 'page-24404801619516814';
const maxContentSize = 150;
const maxRows = 200;

// Restrict results to a specific date range, or leave empty to get the entire history
const minimumDiffDate: Date | null = null;
const maximumDiffDate: Date | null = null;

async function exec () {

  const startDate = minimumDiffDate ?? new Date(0)
  const endDate = maximumDiffDate ?? new Date(Date.now())

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

  const sortedDiffs = page.diffs
    .filter(diff => diff.createdAt >= startDate && diff.createdAt <= endDate)
    .sort((a, b) => a.version - b.version)
    .slice(0, maxRows);
  const dateRange = `${page.diffs[0].createdAt.toLocaleString()} to ${page.diffs[page.diffs.length - 1].createdAt.toLocaleString()}`

  console.log('------------------------------------');
  console.log('Page History');
  console.log('Page Title: ' + page.title);
  console.log('Page Id: ' + page.id);
  console.log('Date Range: ' + dateRange);
  console.log('------------------------------------');
  const tableData = sortedDiffs
    // @ts-ignore
    .map((diff) => diff.data.ds.map((ds, i) => ({
      version: (diff.version + (i * .10)).toFixed(1),
      date: diff.createdAt.toLocaleString(),
      // @ts-ignore
      'User (client #)': usernameMap[diff.createdBy] + ' (' + diff.data.cid + ')',
      // @ts-ignore
      'Version (client / server)': `${diff.data.c} / ${diff.data.s}`,
      // @ts-ignore
      stepType: ds.stepType,
      // @ts-ignore
      position: ds.from === ds.to ? '' + ds.from : `${ds.from} to ${ds.to}`,
      // @ts-ignore
      content: fancyTrim(stringifyStep(ds), maxContentSize)
    })))
    .flat()
    .reduce<Record<string, any>>((acc, { version, ...row }) => {
      acc[version] = row;
      return acc;
    }, {});

  console.table(tableData)

}

function stringifyStep(ds: any) {
  let content = ds.slice?.content || ds.mark;
  if (Array.isArray(content)) {
    // extract marks which are noisy
    content = content.map(({ marks, ...row}) => row);
  }
  return JSON.stringify(content)
}


exec();