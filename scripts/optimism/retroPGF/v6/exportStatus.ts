import { prisma } from '@charmverse/core/prisma-client';
import { stringify } from 'csv-stringify/sync';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { sortBy } from 'lodash-es';
import { writeFileSync } from 'fs';
import { fieldIds, spaceId, templateId, getProjectsFromFile, applicationsFile } from './data';
import { uniq } from 'lodash';
import { getProposals } from './utils';

const fullReviewsummaryFile = './op-full-review-sep-16.csv';
const reviewersFile = './op-reviewers-june-21.csv';

async function exportFullReviewSummary() {
  const pages = await getProposals();
  const applications = await getProjectsFromFile(applicationsFile);
  const mapped: {
    Title: string;
    'Full Review Status': string;
    Link: string;
    'Attestation Id': string;
    Rejected: number;
    'Rejected Reasons': string;
    Approved: number;
    Pending: number;
    // 'Author Email': string;
  }[] = pages.map(({ path, proposal, title }) => {
    const attestationId = proposal!.formAnswers.find((a) => a.fieldId === fieldIds['Attestation ID'])?.value as string;
    const currentEvaluation = getCurrentEvaluation(proposal!.evaluations);
    const evaluation = proposal!.evaluations.find((evaluation) => evaluation.title === 'Full Review');
    if (!evaluation || !currentEvaluation) throw new Error('missing evaluations?');
    const isRuleViolation = currentEvaluation.title === 'Automated Requirements Check';
    const approved = evaluation.reviews.filter((review) => review.result === 'pass').length;
    const rejected = evaluation.reviews.filter((review) => review.result === 'fail').length;
    const rejectedMessages = uniq(
      evaluation.reviews
        .map((review) => review.declineReasons.concat(review.declineMessage || ''))
        .flat()
        .filter(Boolean)
    );
    let status: string;
    if (isRuleViolation) {
      if (currentEvaluation.result === 'pass') {
        status = 'Passed';
      } else {
        status = 'Not started';
      }
    } else {
      if (approved >= 3) {
        status = 'Passed';
      } else if (rejected >= 3) {
        status = 'Rejected';
      } else {
        status = 'Pending';
      }
    }

    // const authorEmails = proposal!.authors.map((author) => author.author.verifiedEmails[0]?.email).filter(Boolean);
    // const application = applications.find((application) => application.project.id === projectId);
    // const applicationEmails =
    //   application?.project.organization?.organization.team.map((member) => member.user.email).filter(Boolean) || [];
    // if (applicationEmails.length === 0) {
    //   console.log('missing author email', title);
    // }

    return {
      Title: title,
      'Full Review Status': status,
      Link: 'https://app.charmverse.io/op-retrofunding-review-process/' + path,
      Rejected: rejected,
      'Rejected Reasons': rejectedMessages.join(', '),
      Approved: approved,
      Pending: 5 - approved - rejected,
      'Attestation Id': attestationId || 'N/A'
      // 'Author Email': authorEmails.join(',')
    };
  });

  const csvData = sortBy(Object.values(mapped), (row) => {
    const status = row['Full Review Status'];
    switch (status) {
      case 'Passed':
        return 1;
      case 'Pending':
        return 2;
      case 'Not started':
        return 3;
      case 'Rejected':
        return 4;
      default:
        return 5;
    }
  });

  const csvString = stringify(csvData, {
    delimiter: '\t',
    header: true,
    columns: [
      'Title',
      'Link',
      'Project Id',
      'Full Review Status',
      'Approved',
      'Rejected',
      // 'Rejected Reasons',
      'Pending'
      // 'Author Email'
    ]
  });

  writeFileSync(fullReviewsummaryFile, csvString);
  console.log('Exported to', fullReviewsummaryFile);
}

async function exportReviewers() {
  const proposals = await prisma.proposal.findMany({
    where: {
      status: 'published',
      spaceId,
      archived: false,
      page: {
        sourceTemplateId: templateId,
        deletedAt: null
      }
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

  console.log('Found', proposals.length, 'proposals');

  // get count of reviews by user
  const countMap = proposals.reduce<
    Record<string, { proposals: Record<string, boolean>; reviewed: Record<string, boolean> }>
  >((acc, proposal) => {
    proposal.evaluations.forEach((evaluation) => {
      evaluation.reviewers.forEach((reviewer) => {
        if (reviewer.userId) {
          acc[reviewer.userId] = acc[reviewer.userId] || { proposals: {}, reviewed: {} };
          acc[reviewer.userId].proposals[proposal.id] = true;
          if (evaluation.reviews.some((review) => review.reviewerId === reviewer.userId)) {
            acc[reviewer.userId].reviewed[proposal.id] = true;
          }
        }
      });
      evaluation.appealReviewers.forEach((reviewer) => {
        if (reviewer.userId) {
          acc[reviewer.userId] = acc[reviewer.userId] || { proposals: {}, reviewed: {} };
          acc[reviewer.userId].proposals[proposal.id] = true;
          if (evaluation.appealReviews.some((review) => review.reviewerId === reviewer.userId)) {
            acc[reviewer.userId].reviewed[proposal.id] = true;
          }
        }
      });
    });
    return acc;
  }, {});

  const userIds = Object.keys(countMap);
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      spaceRoles: {
        some: {
          spaceId
        }
      },
      id: {
        in: userIds
      }
    },
    include: {
      verifiedEmails: true
    }
  });

  console.log('Found', users.length, 'users out of ', userIds.length);

  const csvData = Object.entries(countMap)
    .map(([key, value]) => {
      const user = users.find((user) => user.id === key);
      return {
        Reviewer: user?.username || user?.verifiedEmails[0]?.email || 'N/A',
        Reviewed: Object.keys(value.reviewed).length,
        Assigned: Object.keys(value.proposals).length
      };
    })
    .sort((a, b) => b.Reviewed - a.Reviewed);

  const csvString = stringify(csvData, {
    delimiter: '\t',
    header: true,
    columns: ['Reviewer', 'Reviewed', 'Assigned']
  });
  writeFileSync(reviewersFile, csvString);
  console.log('Exported to', reviewersFile);
}

exportFullReviewSummary().catch(console.error);

//exportReviewers().catch(console.error);
