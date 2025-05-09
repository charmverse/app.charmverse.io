import { prisma } from '@charmverse/core/prisma-client';
import { FarcasterUser } from '@packages/lib/farcaster/getFarcasterUsers';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';

import { readFileSync } from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

const fileContent = readFileSync(path.resolve(__dirname, '../moxie_reviewers.csv'), 'utf-8');

const usernamesToIds: Record<string, string> = {
  edit: 'editpasha.eth'
};

const parsed = Papa.parse(fileContent, {
  // delimiter: '\t', // Use tab as delimiter
  header: true, // Ensure the first line is treated as headers
  skipEmptyLines: true
});
// console.log(parsed.data);
async function query() {
  const rows = parsed.data as {
    Title: string;
    'Proposal Url': string;
    'Reviewer (1)': string;
    'Reviewer (2)': string;
    'Reviewer (3)': string;
  }[];
  const updates: { id: string; reviewers: string[] }[] = [];
  const users = await prisma.user.findMany({
    where: {
      spaceRoles: {
        some: {
          space: {
            domain: 'moxie-grants'
          }
        }
      }
    },
    include: {
      farcasterUser: true
    }
  });
  for (const row of rows) {
    const title = row.Title as string;
    const proposal = await prisma.proposal.findFirst({
      where: {
        page: { path: row['Proposal Url'].split('/').pop() },
        space: { domain: 'moxie-grants' }
      },
      include: {
        evaluations: true
      }
    });
    const reviewers = [row['Reviewer (1)'], row['Reviewer (2)'], row['Reviewer (3)']].map(
      (name) => users.find((user) => (user.farcasterUser?.account as FarcasterUser | undefined)?.username === name)?.id
    );
    if (!proposal) {
      console.log('No proposal found for', row.Title);
      continue;
    }
    const evaluation = proposal.evaluations.find((e) => e.title.startsWith('First Review'));
    if (!evaluation) {
      console.log('No evaluation found for', row.Title);
      continue;
    }
    console.log('Result:', !!proposal, reviewers.length);
    if (reviewers.length > 3) {
      console.log('More than 3 users found for', row.Title);
      console.log(reviewers);
    } else if (reviewers.length < 3) {
      console.log('Less than 3 users found for', row.Title);
      console.log(reviewers);
    }
    await prisma.$transaction([
      prisma.proposalReviewer.deleteMany({
        where: {
          proposalId: proposal.id,
          evaluationId: evaluation.id
        }
      }),
      prisma.proposalReviewer.createMany({
        data: reviewers.map((reviewer) => ({
          proposalId: proposal.id,
          evaluationId: evaluation.id,
          userId: reviewer
        }))
      })
    ]);
  }
  // const w = await prisma.pendingNftTransaction.findFirst({
  //   where: {
  //     id: '1ef3d83b-b371-4954-8f1c-19f7e662b995'
  //   }
  // });
  // console.log(w);
}

query();
