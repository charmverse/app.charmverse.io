import { prisma } from '@charmverse/core/prisma-client';

import { uniq } from 'lodash';
import { fieldIds, spaceId, getProjectsFromFile, OPProjectData, getCsvData } from './retroPGF/v4/data';
import path from 'path';

const repoData = getCsvData<{ Project: string; Remove: string; Replace: string; Stage: string }>(
  '../optimism-data/absent_reviewer_replacements.csv'
);

async function replace() {
  const paths = repoData.map((r) => r.Project.split('/').pop()) as string[];
  const pages = await prisma.page.findMany({
    where: {
      path: {
        in: paths
      },
      spaceId
    }
  });
  console.log('updating', repoData.length, 'rows');
  for (const row of repoData) {
    const path = row.Project.split('/').pop();
    const page = pages.find((page) => page.path === path);
    if (!page) throw new Error('could not find page: ' + path);
    const remove = await prisma.user.findFirst({
      where: {
        verifiedEmails: {
          some: {
            email: row.Remove
          }
        }
      }
    });
    const replace = await prisma.user.findFirst({
      where: {
        verifiedEmails: {
          some: {
            email: row.Replace
          }
        }
      }
    });
    if (!remove) throw new Error('could not find user to remove: ' + row.Remove);
    if (!replace) throw new Error('could not find user to replace: ' + row.Replace);
    if (remove.id === replace.id) throw new Error('cannot replace with the same user: ' + row.Remove);
    if (replace.deletedAt) throw new Error('cannot replace with a deleted user: ' + row.Replace);
    const reviews = await prisma.proposalEvaluationReview.findMany({
      where: {
        evaluation: { proposalId: page.proposalId! },
        reviewerId: remove.id
      }
    });
    if (reviews.length > 0) {
      console.log('reviewer has already reviewed this proposal', reviews.length, row);
    } else {
      // const result = await prisma.proposalReviewer.updateMany({
      //   where: {
      //     proposal: { id: page.proposalId! },
      //     userId: remove.id
      //   },
      //   data: {
      //     userId: replace.id
      //   }
      // });
      // console.log('updated', { ...row, result });
    }
  }
  console.log('Done!');
}

replace().catch((e) => {
  console.error('Error crashed script', e);
  process.exit(1);
});
