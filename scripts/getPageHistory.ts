import { prisma } from '@charmverse/core/prisma-client';
import { fancyTrim } from '@packages/utils/strings';

const spaceDomain = 'binding-amaranth-manatee';
const pagePath = 'test-5942304006288427';
const maxContentSize = 750;
const maxRows = 300;
const minVersion = 0;

// Restrict results to a specific date range, or leave empty to get the entire history
const minimumDiffDate: Date | null = null;
const maximumDiffDate: Date | null = null;

async function exec() {
  const startDate = minimumDiffDate ?? new Date(0);
  const endDate = maximumDiffDate ?? new Date(Date.now());

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

  // calculate the offests to show the last diffs instead of the first ones
  const totalRows = page.diffs.length;
  const rowStart = totalRows - maxRows > 0 ? totalRows - maxRows : 0;
  console.log(page);
  const sortedDiffs = page.diffs
    .filter((diff) => diff.createdAt >= startDate && diff.createdAt <= endDate && diff.version >= minVersion)
    .sort((a, b) => a.version - b.version)
    .slice(0, maxRows);
  //.slice(rowStart, totalRows);
  const dateRange = `${page.diffs[0].createdAt.toLocaleString()} to ${page.diffs[
    page.diffs.length - 1
  ].createdAt.toLocaleString()}`;

  console.log('------------------------------------');
  console.log('Page History');
  console.log('Page Title: ' + page.title);
  console.log('Page Id: ' + page.id);
  console.log('Date Range: ' + dateRange);
  console.log('------------------------------------');
  const tableData = sortedDiffs
    .map((diff) =>
      (diff.data as { ds: any[] })?.ds.map((ds, i) => ({
        version: (diff.version + i * 0.1).toFixed(1),
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
      }))
    )
    .flat()
    .reduce<Record<string, any>>((acc, { version, ...row }) => {
      acc[version] = row;
      return acc;
    }, {});

  console.table(tableData);
}

function stringifyStep(ds: any) {
  let content = ds.slice?.content || ds.mark;
  if (Array.isArray(content)) {
    // extract marks which are noisy
    content = content.map(({ marks, ...row }) => row);
  }
  return JSON.stringify(content);
}

exec();
