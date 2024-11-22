import { log } from '@charmverse/core/log';
import type { CardWithRelations } from '@root/lib/databases/card';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { sortCards } from 'components/common/DatabaseEditor/store/cards';
import { getDefaultBoard } from 'components/proposals/components/ProposalsBoard/utils/boardData';
import { mapProposalToCard } from 'components/proposals/ProposalPage/components/ProposalProperties/hooks/useProposalsBoardAdapter';
import { CardFilter } from 'lib/databases/cardFilter';
import type { FilterGroup } from 'lib/databases/filterGroup';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { getProposals } from 'lib/proposals/getProposals';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(exportProposals);

async function exportProposals(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.id as string;
  const customFilter = req.query.filter as string;
  const viewId = req.query.viewId as string;

  let filter: FilterGroup | null = null;
  if (customFilter) {
    try {
      filter = JSON.parse(customFilter) as FilterGroup;
    } catch (err) {
      log.warn('Could not parse filter when exporting proposals', { error: err, filter: customFilter });
    }
  }

  const userId = req.session.user?.id;

  const ids = await permissionsApiClient.proposals.getAccessibleProposalIds({
    userId,
    spaceId
  });

  const proposals = await getProposals({ ids, spaceId, userId });

  // Convert proposals to cards format for filtering
  const board = getDefaultBoard({
    evaluationStepTitles: []
  });
  const cards = proposals.map((proposal) => mapProposalToCard({ proposal, spaceId }));

  // Apply filters if they exist
  let filteredCards = cards;
  if (filter) {
    filteredCards = CardFilter.applyFilterGroup(filter, board.fields.cardProperties, cards as CardWithRelations[]);
  }

  // Generate CSV content
  let csvContent = '';
  const headers = ['Title', 'Status', 'Current step', 'Authors', 'Reviewers', 'Created', 'Updated', 'Published'];

  const rows: string[][] = [headers];

  filteredCards.forEach((card) => {
    const proposal = proposals.find((p) => p.id === card.id);
    if (!proposal) return;

    const row = [
      proposal.title || 'Untitled',
      proposal.currentStep?.result || 'In progress',
      proposal.currentStep?.title || 'Draft',
      proposal.authors.map((a) => a.userId).join(', '),
      proposal.reviewers.map((r) => r.userId).join(', '),
      new Date(proposal.createdAt).toLocaleString(),
      new Date(proposal.updatedAt).toLocaleString(),
      proposal.publishedAt ? new Date(proposal.publishedAt).toLocaleString() : '-'
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
