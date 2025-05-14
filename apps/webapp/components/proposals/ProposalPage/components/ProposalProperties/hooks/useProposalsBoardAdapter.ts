import { objectUtils } from '@charmverse/core/utilities';
import type { Board } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import type { Card, CardWithRelations } from '@packages/databases/card';
import { CardFilter } from '@packages/databases/cardFilter';
import { PROPOSAL_STEP_LABELS } from '@packages/databases/proposalDbProperties';
import { sortCards } from '@packages/databases/store/cards';
import { blockToFBBlock } from '@packages/databases/utils/blockUtils';
import {
  AUTHORS_BLOCK_ID,
  CREATED_AT_ID,
  DEFAULT_VIEW_BLOCK_ID,
  PROPOSAL_STEP_BLOCK_ID,
  PROPOSAL_REVIEWERS_BLOCK_ID,
  PROPOSAL_STATUS_BLOCK_ID,
  PROPOSAL_EVALUATION_TYPE_ID,
  PROPOSAL_PUBLISHED_AT_ID,
  PROPOSAL_EVALUATION_DUE_DATE_ID
} from '@packages/lib/proposals/blocks/constants';
import type { ProposalPropertyValue } from '@packages/lib/proposals/blocks/interfaces';
import type { ProposalWithUsersLite } from '@packages/lib/proposals/getProposals';
import type { ProposalFields } from '@packages/lib/proposals/interfaces';
import { useMemo } from 'react';

import { getDefaultBoard, getDefaultTableView } from 'components/proposals/components/ProposalsBoard/utils/boardData';
import { useProposals } from 'components/proposals/hooks/useProposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import { useMembers } from 'hooks/useMembers';
import { useProposalBlocks } from 'hooks/useProposalBlocks';

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

  const sortedCards: CardWithRelations[] = useMemo(() => {
    let cards = (proposals || []).map((p) => {
      const isStructuredProposal = !!p.formId;
      return {
        ...mapProposalToCard({ proposal: p, spaceId: space?.id }),
        isStructuredProposal,
        proposal: {
          archived: p.archived,
          currentEvaluationId: p.currentEvaluationId,
          id: p.id,
          // status: p.status,
          currentStep: p.currentStep,
          sourceTemplateId: p.templateId,
          evaluations: p.evaluations,
          hasRewards: (p.fields?.pendingRewards ?? []).length > 0 || (p.rewardIds ?? []).length > 0,
          hasCredentials: !!p.selectedCredentialTemplates.length
        }
      } as CardWithRelations;
    });

    const filter = localViewSettings?.localFilters || activeView?.fields.filter;
    // filter cards by active view filter
    if (filter) {
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
        cards
      ).map((c) => c.id);

      cards = cards.filter((cp) => filteredCardsIds.includes(cp.id));
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

  const views: BoardView[] = [];

  return {
    board,
    boardCustomProperties,
    cards: sortedCards,
    proposalsMap,
    activeView,
    isLoading,
    refreshProposals: mutateProposals,
    views
  };
}

// build mock card from proposal and page data
export function mapProposalToCard({
  proposal,
  spaceId
}: {
  proposal: ProposalWithUsersLite;
  spaceId?: string;
}): Card<ProposalPropertyValue> {
  const proposalFields: ProposalFields = proposal.fields || { properties: {} };
  const proposalSpaceId = spaceId || '';
  proposalFields.properties = {
    ...proposalFields.properties,
    // [Constants.titleColumnId]: proposal.title,
    // add default field values on the fly
    [PROPOSAL_PUBLISHED_AT_ID]: proposal.publishedAt ? new Date(proposal.publishedAt).getTime() : '',
    [PROPOSAL_STATUS_BLOCK_ID]: proposal.archived ? 'archived' : (proposal.currentStep?.result ?? 'in_progress'),
    [AUTHORS_BLOCK_ID]: (proposal && 'authors' in proposal && proposal.authors?.map((a) => a.userId)) || '',
    [PROPOSAL_STEP_BLOCK_ID]: proposal.currentStep?.title ?? 'Draft',
    [PROPOSAL_EVALUATION_TYPE_ID]: proposal.currentStep?.step ?? 'draft',
    [PROPOSAL_REVIEWERS_BLOCK_ID]:
      proposal && 'reviewers' in proposal
        ? proposal.reviewers.map(({ userId, roleId, systemRole }) => ({ userId, roleId, systemRole }))
        : [],
    [PROPOSAL_EVALUATION_DUE_DATE_ID]: proposal.currentStep?.dueDate
      ? new Date(proposal.currentStep.dueDate).getTime()
      : ''
  };
  const card: Card<ProposalPropertyValue> = {
    id: proposal.id,
    spaceId: proposalSpaceId,
    title: proposal.title,
    rootId: proposalSpaceId,
    type: 'card' as const,
    updatedBy: proposal.updatedBy,
    createdBy: proposal.createdBy,
    createdAt: new Date(proposal.createdAt).getTime(),
    updatedAt: new Date(proposal.updatedAt).getTime(),
    fields: { properties: {}, ...proposalFields, contentOrder: [] }
  };

  return card;
}
