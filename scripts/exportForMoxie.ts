import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';
import { DateTime } from 'luxon';
import Papa from 'papaparse';
import { stringify } from 'csv-stringify/sync';

const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 30 }, { zone: 'utc' }); // Actual launch: 2024-W40
const currentSeason = currentSeasonStartDate.toFormat(`kkkk-'W'WW`);

// read tsv file
const fs = require('fs');
const tsv = fs.readFileSync('./database-export.csv', 'utf8');

const parsed = Papa.parse(tsv, {
  delimiter: '\t', // Use tab as delimiter
  header: true, // Ensure the first line is treated as headers
  skipEmptyLines: true
});

async function query() {
  const allUsersData = [];
  for (const row of parsed.data as any[]) {
    const page = await prisma.page.findFirst({
      where: {
        title: row.Title,
        space: {
          domain: 'moxie-grants'
        },
        deletedAt: null,
        type: 'proposal'
      },
      include: {
        proposal: {
          include: {
            authors: {
              include: {
                author: {
                  include: {
                    farcasterUser: true
                  }
                }
              }
            }
          }
        }
      }
    });
    if (!page) {
      console.log('Page not found', row);
      continue;
    }
    if (!page!.proposal!.authors[0]?.author.farcasterUser?.fid) {
      console.log('No Farcaster user', page.title, page.path);
    }
    allUsersData.push({
      ...row,
      'Author Farcaster': page!.proposal!.authors[0]?.author.farcasterUser?.fid
    });
  }
  console.log('done');
  const csvString = stringify(allUsersData, {
    delimiter: '\t',
    header: true,
    columns: [...parsed.meta.fields!.slice(0, 2), 'Author Farcaster', ...parsed.meta.fields!.slice(2)]
  });

  fs.writeFileSync('./database-export-with-farcaster.tsv', csvString);
}

// query();
// getRepos();
query();
