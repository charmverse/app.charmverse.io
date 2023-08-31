import type { PageMeta } from '@charmverse/core/pages';
import { useState } from 'react';

import { useProposals } from 'components/proposals/hooks/useProposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useProposalBlocks } from 'hooks/useProposalBlocks';
import type { BlockTypes } from 'lib/focalboard/block';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card, CardPage } from 'lib/focalboard/card';
import type { ProposalFieldsProp } from 'lib/proposal/blocks/interfaces';

export type BoardProposal = { spaceId?: string; id?: string } & ProposalFieldsProp;

const defaultView: BoardView = {
  fields: {
    viewType: 'table',
    sortOptions: [],
    visiblePropertyIds: [],
    visibleOptionIds: [],
    hiddenOptionIds: [],
    collapsedOptionIds: [],
    filter: { operation: 'and', filters: [] },
    cardOrder: [],
    columnWidths: {},
    columnCalculations: {},
    kanbanCalculations: {},
    defaultTemplateId: ''
  }
};

export function useProposalsBoardAdapter() {
  const [boardProposal, setBoardProposal] = useState<BoardProposal | null>(null);
  const { space } = useCurrentSpace();
  const { proposals } = useProposals();
  const { pages } = usePages();
  const { proposalPropertiesBlock } = useProposalBlocks();
  const proposalPage = pages[boardProposal?.id || ''];

  const cardPages: CardPage[] =
    proposals
      ?.map((p: any) => {
        const page = pages[p?.id];

        return mapProposalToCardPage({ proposal: p, proposalPage: page, spaceId: space?.id });
      })
      .filter((cp): cp is CardPage => !!cp.card && !!cp.page) || [];

  // board with all proposal properties
  const board: Board = {
    fields: { cardProperties: proposalPropertiesBlock?.fields?.properties || [] }
  } as unknown as Board;

  // card from current proposal
  const card: Card = mapProposalToCardPage({ proposal: boardProposal, proposalPage, spaceId: space?.id }).card;

  // each proposal with fields reflects a card
  const cards: Card[] = cardPages.map((cp) => cp.card) || [];

  // mock needed properties unused for now
  const activeView = defaultView;
  const views: BoardView[] = [];

  return { board, card, cards, cardPages, activeView, views, proposalPage, boardProposal, setBoardProposal };
}

// build mock card from proposal and page data
function mapProposalToCardPage({
  proposal,
  proposalPage,
  spaceId
}: {
  proposal: BoardProposal | null;
  proposalPage?: PageMeta;
  spaceId?: string;
}) {
  const proposalFields = proposal?.fields || { properties: {} };
  const proposalSpaceId = proposal?.spaceId || spaceId || '';

  const card: Card = {
    id: proposal?.id || '',
    spaceId: proposalSpaceId,
    parentId: '',
    schema: 1,
    title: proposalPage?.title || '',
    rootId: proposalSpaceId,
    type: 'card' as BlockTypes,
    updatedBy: proposalPage?.updatedBy || '',
    createdBy: proposalPage?.createdBy || '',
    createdAt: proposalPage?.createdAt ? new Date(proposalPage?.createdAt).getTime() : 0,
    updatedAt: proposalPage?.updatedAt ? new Date(proposalPage?.updatedAt).getTime() : 0,
    deletedAt: null,
    fields: { ...proposalFields, contentOrder: [] }
  };

  return { card, page: proposalPage };
}
