import type { TargetPermissionGroup } from '@charmverse/core/dist/cjs/permissions';
import type { PageMeta } from '@charmverse/core/pages';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { useMemo, useState } from 'react';

import { sortCards } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { blockToFBBlock } from 'components/common/BoardEditor/utils/blockUtils';
import { getDefaultBoard, getDefaultTableView } from 'components/proposals/components/ProposalsBoard/utils/boardData';
import { useProposalCategories } from 'components/proposals/hooks/useProposalCategories';
import { useProposals } from 'components/proposals/hooks/useProposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import { useProposalBlocks } from 'hooks/useProposalBlocks';
import type { BlockTypes } from 'lib/focalboard/block';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card, CardPage } from 'lib/focalboard/card';
import { CardFilter } from 'lib/focalboard/cardFilter';
import {
  AUTHORS_BLOCK_ID,
  CATEGORY_BLOCK_ID,
  DEFAULT_VIEW_BLOCK_ID,
  EVALUATION_TYPE_BLOCK_ID,
  PROPOSAL_REVIEWERS_BLOCK_ID,
  STATUS_BLOCK_ID,
  CREATED_AT_ID
} from 'lib/proposal/blocks/constants';
import type { ProposalFields, ProposalFieldsProp, ProposalPropertyValue } from 'lib/proposal/blocks/interfaces';

export type BoardProposal = { spaceId?: string; id?: string } & ProposalFieldsProp;

export function useProposalsBoardAdapter() {
  const [boardProposal, setBoardProposal] = useState<BoardProposal | null>(null);
  const { space } = useCurrentSpace();
  const { membersRecord } = useMembers();
  const { proposals } = useProposals();
  const { categories } = useProposalCategories();
  const { pages } = usePages();
  const { proposalPropertiesBlock, proposalBlocks } = useProposalBlocks();
  const proposalPage = pages[boardProposal?.id || ''];

  // board with all proposal properties and default properties
  const board: Board = getDefaultBoard({
    storedBoard: proposalPropertiesBlock,
    categories
  });

  const activeView = useMemo(() => {
    // use saved default block or build on the fly
    const viewBlock = proposalBlocks?.find((b) => b.id === DEFAULT_VIEW_BLOCK_ID);

    if (!viewBlock) {
      return getDefaultTableView({ storedBoard: proposalPropertiesBlock, categories });
    }

    const boardView = blockToFBBlock(viewBlock) as BoardView;

    // sort by created at desc by default
    if (!boardView.fields.sortOptions?.length) {
      boardView.fields.sortOptions = [{ propertyId: CREATED_AT_ID, reversed: true }];
    }

    return boardView;
  }, [categories, proposalPropertiesBlock, proposalBlocks]);

  const cardPages: CardPage[] = useMemo(() => {
    let cards =
      proposals
        ?.map((p) => {
          const page = pages[p?.id];

          return mapProposalToCardPage({ proposal: p, proposalPage: page, spaceId: space?.id });
        })
        .filter((cp): cp is CardPage => !!cp.card && !!cp.page) || [];

    // filter cards by active view filter
    if (activeView?.fields.filter) {
      const cardsRaw = cards.map((cp) => cp.card);
      const filteredCardsIds = CardFilter.applyFilterGroup(
        activeView.fields.filter,
        board.fields.cardProperties,
        cardsRaw,
        pages
      ).map((c) => c.id);

      cards = cards.filter((cp) => filteredCardsIds.includes(cp.card.id));
    }

    const sortedCardPages = activeView ? sortCards(cards, board, activeView, membersRecord) : [];

    return sortedCardPages;
  }, [activeView, board, membersRecord, pages, proposals, space?.id]);

  const boardCustomProperties: Board = getDefaultBoard({
    storedBoard: proposalPropertiesBlock,
    customOnly: true,
    categories: []
  });

  // card from current proposal
  const card: Card<ProposalPropertyValue> = mapProposalToCardPage({
    proposal: boardProposal,
    proposalPage,
    spaceId: space?.id
  }).card;

  // each proposal with fields reflects a card
  const cards: Card[] = cardPages.map((cp) => cp.card) || [];

  const views: BoardView[] = [];

  return {
    board,
    boardCustomProperties,
    card,
    cards,
    cardPages,
    activeView,
    views,
    proposalPage,
    boardProposal,
    setBoardProposal
  };
}

// build mock card from proposal and page data
function mapProposalToCardPage({
  proposal,
  proposalPage,
  spaceId
}: {
  proposal: BoardProposal | ProposalWithUsers | null;
  proposalPage?: PageMeta;
  spaceId?: string;
}) {
  const proposalFields = (proposal?.fields || { properties: {} }) as ProposalFields;
  const proposalSpaceId = proposal?.spaceId || spaceId || '';

  proposalFields.properties = {
    ...proposalFields.properties,
    // add default field values on the fly
    [CREATED_AT_ID]:
      proposalPage && 'createdAt' in proposalPage && proposalPage.createdAt
        ? new Date(proposalPage?.createdAt).getTime()
        : '',
    [CATEGORY_BLOCK_ID]: (proposal && 'categoryId' in proposal && proposal.categoryId) || '',
    [STATUS_BLOCK_ID]: (proposal && 'status' in proposal && proposal.status) || '',
    [EVALUATION_TYPE_BLOCK_ID]: (proposal && 'evaluationType' in proposal && proposal.evaluationType) || '',
    [AUTHORS_BLOCK_ID]: (proposal && 'authors' in proposal && proposal.authors?.map((a) => a.userId)) || '',
    [PROPOSAL_REVIEWERS_BLOCK_ID]:
      proposal && 'reviewers' in proposal
        ? proposal.reviewers.map(
            (r) =>
              ({ group: r.userId ? 'user' : 'role', id: r.userId ?? r.roleId } as TargetPermissionGroup<
                'user' | 'role'
              >)
          )
        : []
  };

  const card: Card<ProposalPropertyValue> = {
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
