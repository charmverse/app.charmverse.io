import type { TargetPermissionGroup } from '@charmverse/core/permissions';
import { objectUtils } from '@charmverse/core/utilities';
import { useMemo } from 'react';

import { sortCards } from 'components/common/DatabaseEditor/store/cards';
import { blockToFBBlock } from 'components/common/DatabaseEditor/utils/blockUtils';
import { getDefaultBoard, getDefaultTableView } from 'components/proposals/components/ProposalsBoard/utils/boardData';
import { useProposals } from 'components/proposals/hooks/useProposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import { useMembers } from 'hooks/useMembers';
import { useProposalBlocks } from 'hooks/useProposalBlocks';
import type { BlockTypes } from 'lib/databases/block';
import type { Board } from 'lib/databases/board';
import type { BoardView } from 'lib/databases/boardView';
import type { Card, CardPage } from 'lib/databases/card';
import { CardFilter } from 'lib/databases/cardFilter';
import { Constants } from 'lib/databases/constants';
import { PROPOSAL_STEP_LABELS } from 'lib/databases/proposalDbProperties';
import {
  AUTHORS_BLOCK_ID,
  CREATED_AT_ID,
  DEFAULT_VIEW_BLOCK_ID,
  PROPOSAL_STEP_BLOCK_ID,
  PROPOSAL_REVIEWERS_BLOCK_ID,
  PROPOSAL_STATUS_BLOCK_ID,
  PROPOSAL_EVALUATION_TYPE_ID
} from 'lib/proposals/blocks/constants';
import type { ProposalPropertyValue } from 'lib/proposals/blocks/interfaces';
import type { ProposalWithUsersLite } from 'lib/proposals/getProposals';
import type { ProposalFields } from 'lib/proposals/interfaces';

export function useProposalsBoardAdapter() {
  const { space } = useCurrentSpace();
  const { membersRecord } = useMembers();
  const { proposals, proposalsMap, mutateProposals, isLoading: isProposalsLoading } = useProposals();
  const { proposalBoardBlock, proposalBlocks } = useProposalBlocks();

  const isLoading = isProposalsLoading;

  const localViewSettings = useLocalDbViewSettings(`proposals-${space?.id}-${DEFAULT_VIEW_BLOCK_ID}`);

  const evaluationStepTitles = useMemo(() => {
    const _evaluationStepTitles: Set<string> = new Set();
    proposals?.forEach((p) => {
      p.evaluations.forEach((e) => {
        _evaluationStepTitles.add(e.title);
      });
    });
    return Array.from(_evaluationStepTitles);
  }, [proposals]);

  // board with all proposal properties and default properties
  const board: Board = useMemo(
    () =>
      getDefaultBoard({
        storedBoard: proposalBoardBlock,
        evaluationStepTitles
      }),
    [evaluationStepTitles, proposalBoardBlock]
  );

  const activeView = useMemo(() => {
    // use saved default block or build on the fly
    const viewBlock = proposalBlocks?.find((b) => b.id === DEFAULT_VIEW_BLOCK_ID);

    if (!viewBlock) {
      const boardView = getDefaultTableView({ board });
      // sort by created at desc by default
      if (!boardView.fields.sortOptions?.length) {
        boardView.fields.sortOptions = [{ propertyId: CREATED_AT_ID, reversed: true }];
      }
      return boardView;
    }
    const boardView = blockToFBBlock(viewBlock) as BoardView;

    return boardView;
  }, [board, proposalBlocks]);

  const cardPages: CardPage[] = useMemo(() => {
    let cards =
      proposals
        ?.map((p) => {
          const isStructuredProposal = !!p.formId;
          return {
            ...mapProposalToCardPage({ proposal: p, spaceId: space?.id }),
            isStructuredProposal,
            proposal: {
              archived: p.archived,
              currentEvaluationId: p.currentEvaluationId,
              id: p.id,
              // status: p.status,
              currentStep: p.currentStep,
              sourceTemplateId: p.templateId,
              evaluations: p.evaluations,
              hasRewards: (p.fields?.pendingRewards ?? []).length > 0 || (p.rewardIds ?? []).length > 0
            }
          } as CardPage;
        })
        .filter((cp): cp is CardPage => !!cp.card && !!cp.page) || [];

    const filter = localViewSettings?.localFilters || activeView?.fields.filter;
    // filter cards by active view filter
    if (filter) {
      const cardsRaw = cards.map((cp) => cp.card);
      const filteredCardsIds = CardFilter.applyFilterGroup(
        filter,
        [
          ...board.fields.cardProperties,
          {
            id: PROPOSAL_EVALUATION_TYPE_ID,
            name: 'Evaluation Type',
            options: objectUtils.typedKeys(PROPOSAL_STEP_LABELS).map((evaluationType) => ({
              color: 'propColorGray',
              id: evaluationType,
              value: evaluationType
            })),
            type: 'proposalEvaluationType'
          }
        ],
        cardsRaw
      ).map((c) => c.id);

      cards = cards.filter((cp) => filteredCardsIds.includes(cp.card.id));
    }

    const sortedCardPages = activeView
      ? sortCards(cards, board, activeView, membersRecord, {}, localViewSettings?.localSort)
      : [];

    return sortedCardPages;
  }, [
    activeView,
    board,
    localViewSettings?.localFilters,
    localViewSettings?.localSort,
    membersRecord,
    proposals,
    space?.id
  ]);

  const boardCustomProperties: Board = getDefaultBoard({
    storedBoard: proposalBoardBlock,
    customOnly: true,
    evaluationStepTitles
  });

  // each proposal with fields reflects a card
  const cards: Card[] = cardPages.map((cp) => cp.card);

  const views: BoardView[] = [];

  return {
    board,
    boardCustomProperties,
    cards,
    cardPages,
    proposalsMap,
    activeView,
    isLoading,
    refreshProposals: mutateProposals,
    views
  };
}

// build mock card from proposal and page data
export function mapProposalToCardPage({
  proposal,
  spaceId
}: {
  proposal: ProposalWithUsersLite;
  spaceId?: string;
}): CardPage<ProposalPropertyValue> {
  const proposalFields: ProposalFields = proposal.fields || { properties: {} };
  const proposalSpaceId = spaceId || '';
  proposalFields.properties = {
    ...proposalFields.properties,
    [Constants.titleColumnId]: proposal.title,
    // add default field values on the fly
    [PROPOSAL_STATUS_BLOCK_ID]: proposal.archived ? 'archived' : proposal.currentStep?.result ?? 'in_progress',
    [AUTHORS_BLOCK_ID]: (proposal && 'authors' in proposal && proposal.authors?.map((a) => a.userId)) || '',
    [PROPOSAL_STEP_BLOCK_ID]: proposal.currentStep?.title ?? 'Draft',
    [PROPOSAL_EVALUATION_TYPE_ID]: proposal.currentStep?.step ?? 'draft',
    [PROPOSAL_REVIEWERS_BLOCK_ID]:
      proposal && 'reviewers' in proposal
        ? proposal.reviewers.map(
            (r) =>
              ({
                group: r.userId ? 'user' : r.roleId ? 'role' : 'system_role',
                id: r.userId ?? r.roleId ?? r.systemRole
              } as TargetPermissionGroup<'user' | 'role'>)
          )
        : []
  };
  const card: Card<ProposalPropertyValue> = {
    id: proposal.id,
    spaceId: proposalSpaceId,
    parentId: '',
    schema: 1,
    title: proposal.title,
    rootId: proposalSpaceId,
    type: 'card' as BlockTypes,
    updatedBy: proposal.updatedBy,
    createdBy: proposal.createdBy,
    createdAt: new Date(proposal.createdAt).getTime(),
    updatedAt: new Date(proposal.updatedAt).getTime(),
    deletedAt: null,
    fields: { properties: {}, ...proposalFields, contentOrder: [] }
  };

  return {
    card,
    page: {
      id: proposal.id,
      title: proposal.title,
      updatedAt: new Date(proposal.updatedAt),
      updatedBy: proposal.updatedBy,
      bountyId: null,
      hasContent: true,
      icon: null,
      type: 'bounty',
      syncWithPageId: null,
      path: '',
      proposalId: proposal.id
    }
  };
}
