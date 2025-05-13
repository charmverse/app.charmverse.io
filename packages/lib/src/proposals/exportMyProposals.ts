import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl } from '@packages/config/constants';

import { getUserProposals } from './getUserProposals';

export async function exportMyProposals({ spaceId, userId }: { spaceId: string; userId: string }) {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      domain: true
    }
  });
  const userProposals = await getUserProposals({ spaceId, userId });

  let csvContent = '';
  const rows: string[][] = [
    [
      'Title',
      'Status',
      'Current step',
      'Your review',
      'Approved',
      'Declined',
      'URL',
      ...(userProposals.customColumns?.map((column) => column.title) ?? [])
    ]
  ];

  const allProposals = [...userProposals.actionable, ...userProposals.authored, ...userProposals.review_completed];

  allProposals.forEach((proposal) => {
    const row = [
      proposal.title || 'Untitled',
      proposal.currentEvaluation?.result
        ? proposal.currentEvaluation.result === 'pass'
          ? 'Passed'
          : 'Declined'
        : 'In progress',
      proposal.status === 'draft' ? 'Draft' : proposal.currentEvaluation?.title || 'Evaluation',
      proposal.userReviewResult || '-',
      proposal.totalPassedReviewResults?.toString() || '-',
      proposal.totalFailedReviewResults?.toString() || '-',
      `${baseUrl}/${space.domain}/${proposal.path}`,
      ...(userProposals.customColumns?.map((column) => {
        const customValue = proposal.customColumns?.find((c) => c.formFieldId === column.formFieldId)?.value;
        if (column.type === 'select' || column.type === 'multiselect') {
          return column.options.find((opt) => opt.id === customValue)?.name || '-';
        }
        return (customValue as string) || '-';
      }) ?? [])
    ];
    rows.push(row);
  });

  rows.forEach((row) => {
    const encodedRow = row.join('\t');
    csvContent += `${encodedRow}\r\n`;
  });

  return csvContent;
}
