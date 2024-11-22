import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from '@packages/utils/types';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { mapProposalToCard } from 'components/proposals/ProposalPage/components/ProposalProperties/hooks/useProposalsBoardAdapter';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { getProposals } from 'lib/proposals/getProposals';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(exportProposals);

async function exportProposals(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.id as string;

  const userId = req.session.user?.id;

  const ids = await permissionsApiClient.proposals.getAccessibleProposalIds({
    userId,
    spaceId
  });

  const [proposals, spaceMembers] = await Promise.all([
    getProposals({ ids, spaceId, userId }),
    prisma.user.findMany({
      where: {
        spaceRoles: {
          some: {
            spaceId
          }
        }
      },
      select: {
        id: true,
        username: true
      }
    })
  ]);

  const userRecord = spaceMembers.reduce<Record<string, string>>((acc, user) => {
    acc[user.id] = user.username;
    return acc;
  }, {});

  const cards = proposals.map((proposal) => mapProposalToCard({ proposal, spaceId }));

  const headers = ['Title', 'Status', 'Current step', 'Authors', 'Reviewers', 'Created', 'Updated', 'Published'];

  const rows: string[][] = [headers];

  cards.forEach((card) => {
    const proposal = proposals.find((p) => p.id === card.id);
    if (!proposal) return;

    const row = [
      proposal.title || 'Untitled',
      proposal.currentStep?.result || 'In progress',
      proposal.currentStep?.title || 'Draft',
      proposal.authors
        .map((a) => a.userId)
        .filter(isTruthy)
        .map((id) => userRecord[id])
        .join(', '),
      proposal.reviewers
        .map((r) => r.userId)
        .filter(isTruthy)
        .map((id) => userRecord[id])
        .join(', '),
      new Date(proposal.createdAt).toLocaleString(),
      new Date(proposal.updatedAt).toLocaleString(),
      proposal.publishedAt ? new Date(proposal.publishedAt).toLocaleString() : '-'
    ];
    rows.push(row);
  });

  const csvContent = rows.map((row) => row.join('\t')).join('\r\n');

  return res.status(200).send(csvContent);
}

export default withSessionRoute(handler);
