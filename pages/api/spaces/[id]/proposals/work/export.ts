import { getUserProposals } from '@root/lib/proposals/getUserProposals';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { requireSpaceMembership, onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(exportUserProposalsController).use(requireSpaceMembership({ spaceIdKey: 'id', adminOnly: false }));

async function exportUserProposalsController(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user?.id;
  const spaceId = req.query.id as string;
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

  return res.status(200).send(csvContent);
}

export default withSessionRoute(handler);
