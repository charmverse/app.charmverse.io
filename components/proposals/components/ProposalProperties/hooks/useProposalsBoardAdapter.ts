import type { PageMeta } from '@charmverse/core/dist/cjs/pages';

import { useProposals } from 'components/proposals/hooks/useProposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useProposalBlocks } from 'hooks/useProposalBlocks';
import type { BlockTypes } from 'lib/focalboard/block';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import type { ProposalFields } from 'lib/proposal/blocks/interfaces';

type Props = {
  proposal: { spaceId?: string; id?: string } & ProposalFields;
  onChange?: (values: ProposalFields) => void;
};

export function useProposalsBoardAdapter({ proposal }: Props) {
  const { space } = useCurrentSpace();
  const { proposals } = useProposals();
  const { pages } = usePages();
  const { proposalPropertiesBlock } = useProposalBlocks();
  const proposalPage = pages[proposal?.id || ''];

  const board: Board = {
    fields: { cardProperties: proposalPropertiesBlock?.fields?.properties || [] }
  } as unknown as Board;

  // card from current proposal
  const card: Card = mapProposalToCard({ proposal, proposalPage, spaceId: space?.id });

  // each proposal with fields reflects a card
  const cards: Card[] =
    proposals?.map((p: any) => {
      const page = pages[p?.id];

      return mapProposalToCard({ proposal: p, proposalPage: page, spaceId: space?.id });
    }) || [];

  // mock needed properties unused for now
  const activeView = { fields: {} } as BoardView;
  const views: BoardView[] = [];

  return { board, card, cards, activeView, views, proposalPage };
}

// build mock card from proposal and page data
function mapProposalToCard({
  proposal,
  proposalPage,
  spaceId
}: {
  proposal: { spaceId?: string; id?: string } & ProposalFields;
  proposalPage?: PageMeta;
  spaceId?: string;
}) {
  const proposalFields = proposal?.fields || {};
  const proposalSpaceId = proposal?.spaceId || spaceId || '';

  return {
    id: proposal?.id || '',
    spaceId: proposalSpaceId,
    parentId: '',
    schema: 1,
    title: proposalPage?.title || '',
    rootId: proposalSpaceId,
    type: 'card' as BlockTypes,
    updatedBy: proposalPage?.updatedBy || '',
    createdBy: proposalPage?.createdBy || '',
    createdAt: proposalPage?.createdAt?.getTime() || 0,
    updatedAt: proposalPage?.updatedAt?.getTime() || 0,
    deletedAt: null,
    fields: { ...proposalFields, contentOrder: [] }
  };
}
