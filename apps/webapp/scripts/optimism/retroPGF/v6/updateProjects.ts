import { uniq } from 'lodash';
import { upsertProposalFormAnswers } from '@packages/lib/proposals/forms/upsertProposalFormAnswers';

import { charmValue, getProposals, findProposalMatch } from './utils';
import { getProjectsFromFile, spaceId, applicationsFile, fieldIds } from './data';
import { prisma } from '@charmverse/core/prisma-client';
import fs from 'fs';
import Papa from 'papaparse';

interface UpdateRow {
  title: string;
  attestationId: string;
  id: string;
  empty: string;
}

const updates: { title: string; attestationId: string; emails: string[] }[] = [];

const fileContent = fs.readFileSync('updates.tsv', 'utf8');

Papa.parse(fileContent, {
  delimiter: '\t',
  header: false,
  complete: (results) => {
    updates.push(
      ...(results.data as string[][]).map((row) => ({
        title: row[0],
        attestationId: row[1],
        emails: row.slice(4).filter(Boolean)
      }))
    );
  }
});

async function updateProjects() {
  // Note: file path is relative to CWD
  const applications = await getProjectsFromFile(applicationsFile);
  const proposals = await getProposals();
  const reviewers = await prisma.user.findMany({
    where: {
      deletedAt: null,
      username: {
        in: ['marcopolo', 'lightclient', 'webby1111@hotmail.com']
      },
      spaceRoles: {
        some: {
          spaceId
        }
      }
    }
  });
  console.log(reviewers.length);

  for (let application of updates) {
    const proposal = proposals.find((p) => p.title === application.title);
    if (!proposal) {
      throw new Error('No proposal found for: ' + application.title);
    }
    const newReviewers = await prisma.user.findMany({
      where: {
        email: { in: application.emails }
      }
    });
    const _reviewers = proposal.proposal!.evaluations.find((e) => e.title === 'Full Review')?.reviewers || [];

    const reviewersToUpdate = _reviewers.filter((r) => reviewers.some((_r) => _r.id === r.userId));
    // console.log(reviewers, application.emails);
    console.log(reviewersToUpdate.length, application.emails.length, newReviewers.length);
    for (const reviewer of reviewersToUpdate) {
      const newReviewer = newReviewers[reviewersToUpdate.indexOf(reviewer)];
      if (!newReviewer) {
        throw new Error('No new reviewer found for: ' + reviewer.userId);
      }
      await prisma.proposalReviewer.update({
        where: { id: reviewer.id },
        data: { userId: newReviewer.id }
      });
    }
    console.log('Updated proposal. Path:', '/' + proposal.path);
  }

  console.log('Done!');
}

updateProjects().catch((e) => console.error('Error crashed script', e));
