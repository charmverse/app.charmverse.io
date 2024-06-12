import { prisma } from '@charmverse/core/prisma-client';
import { stringify } from 'csv-stringify/sync';

import { writeFileSync } from 'fs';
import { spaceId } from './retroData';

type SummaryRow = {};

const summaryFile = './op-review-summary.csv';
const reviewersFile = './op-reviewers.csv';

async function exportSummary() {
  const proposals = await prisma.proposal.findMany({
    where: {
      status: 'published',
      spaceId
    },
    include: {
      evaluations: {
        include: {
          reviews: true,
          appealReviews: true
        }
      }
    }
  });
  const total = proposals.length;
  // get count of proposals by reviews
  const countMap = proposals.reduce<Record<string, number>>((acc, proposal) => {
    const count = proposal.evaluations
      .filter((evaluation) => evaluation.title === 'Rule Violation Check')
      .map((evaluation) => evaluation.appealReviews.length + evaluation.reviews.length)
      .reduce((acc, count) => acc + count, 0);
    acc[count] = acc[count] ? acc[count] + 1 : 1;
    return acc;
  }, {});

  const csvData = Object.entries(countMap)
    .map(([key, value]) => {
      return {
        Proposals: value + ' out of ' + total,
        Reviews: key
        // Total: total
      };
    })
    .sort((a, b) => parseInt(a.Reviews) - parseInt(b.Reviews));

  const csvString = stringify(csvData, { header: true, columns: ['Proposals', 'Reviews'] });

  if (csvData.length) {
    for (const row of csvData) {
      console.log(row['Proposals'] + ' have ' + row['Reviews'] + ' reviews');
    }
    // writeFileSync(summaryFile, csvString);
  }
}

async function exportMembers() {
  const proposals = await prisma.proposal.findMany({
    where: {
      status: 'published',
      spaceId
    },
    include: {
      evaluations: {
        include: {
          reviewers: true,
          appealReviewers: true,
          reviews: true,
          appealReviews: true
        }
      }
    }
  });

  // get count of reviews by user
  const countMap = proposals.reduce<Record<string, { proposals: number; reviewed: number }>>((acc, proposal) => {
    proposal.evaluations
      .filter((evaluation) => evaluation.title === 'Rule Violation Check')
      .forEach((evaluation) => {
        evaluation.reviewers.forEach((reviewer) => {
          if (reviewer.userId) {
            acc[reviewer.userId] = acc[reviewer.userId] || { proposals: 0, reviewed: 0 };
            acc[reviewer.userId].proposals++;
            if (evaluation.reviews.some((review) => review.reviewerId === reviewer.userId)) {
              acc[reviewer.userId].reviewed++;
            }
          }
        });
      });
    return acc;
  }, {});

  const userIds = Object.keys(countMap);
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds
      }
    },
    include: {
      verifiedEmails: true
    }
  });

  const csvData = Object.entries(countMap)
    .map(([key, value]) => {
      const user = users.find((user) => user.id === key);
      return {
        Reviewer: user?.verifiedEmails[0]?.email || user?.username || 'N/A',
        Reviews: value.reviewed,
        'Assigned proposals': value.proposals
      };
    })
    .sort((a, b) => b.Reviews - a.Reviews);

  const csvString = stringify(csvData, { header: true, columns: ['Reviewer', 'Reviews', 'Assigned proposals'] });
  writeFileSync(reviewersFile, csvString);
}

exportMembers().catch(console.error);
