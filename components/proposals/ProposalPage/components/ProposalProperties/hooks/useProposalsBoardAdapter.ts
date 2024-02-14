import type { PageMeta } from '@charmverse/core/pages';
import type { TargetPermissionGroup } from '@charmverse/core/permissions';
import { objectUtils } from '@charmverse/core/utilities';
import { useMemo, useState } from 'react';

import { sortCards } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { blockToFBBlock } from 'components/common/BoardEditor/utils/blockUtils';
import { getDefaultBoard, getDefaultTableView } from 'components/proposals/components/ProposalsBoard/utils/boardData';
import { useProposals } from 'components/proposals/hooks/useProposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import { useProposalBlocks } from 'hooks/useProposalBlocks';
import type { BlockTypes } from 'lib/focalboard/block';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card, CardPage } from 'lib/focalboard/card';
import { CardFilter } from 'lib/focalboard/cardFilter';
import { Constants } from 'lib/focalboard/constants';
import { PROPOSAL_STEP_LABELS } from 'lib/focalboard/proposalDbProperties';
import {
  AUTHORS_BLOCK_ID,
  CREATED_AT_ID,
  DEFAULT_VIEW_BLOCK_ID,
  PROPOSAL_STEP_BLOCK_ID,
  PROPOSAL_REVIEWERS_BLOCK_ID,
  PROPOSAL_STATUS_BLOCK_ID,
  PROPOSAL_EVALUATION_TYPE_ID
} from 'lib/proposal/blocks/constants';
import type { ProposalPropertyValue } from 'lib/proposal/blocks/interfaces';
import type { ProposalWithUsersLite } from 'lib/proposal/getProposals';
import type { ProposalFields } from 'lib/proposal/interface';

export type BoardProposal = { createdAt: string; spaceId?: string; id?: string; fields: ProposalFields | null };

export function useProposalsBoardAdapter() {
  const [boardProposal, setBoardProposal] = useState<BoardProposal | null>(null);
  const { space } = useCurrentSpace();
  const { membersRecord } = useMembers();
  const { proposals, mutateProposals, isLoading: isProposalsLoading } = useProposals();
  const { pages, loadingPages: isPagesLoading } = usePages();
  const { proposalBoardBlock, proposalBlocks } = useProposalBlocks();
  const proposalPage = pages[boardProposal?.id || ''];
  const proposalData = proposals?.find((p) => p.id === boardProposal?.id);

  const proposal: ProposalWithUsersLite = {
    authors: [],
    currentStep: { title: '', step: 'draft', id: '', index: 0, result: 'in_progress' },
    reviewers: [],
    evaluations: [],
    id: '',
    createdAt: '',
    createdBy: '',
    status: 'draft',
    spaceId: '',
    ...boardProposal,
    ...proposalData,
    fields: {
      ...proposalData?.fields,
      properties: {
        ...proposalData?.fields?.properties,
        ...boardProposal?.fields?.properties
      }
    },
    rewardIds: []
  };
  const isLoading = isProposalsLoading || isPagesLoading;

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
      return getDefaultTableView({ board });
    }
    const boardView = blockToFBBlock(viewBlock) as BoardView;
    // sort by created at desc by default
    if (!boardView.fields.sortOptions?.length) {
      boardView.fields.sortOptions = [{ propertyId: CREATED_AT_ID, reversed: true }];
    }

    return boardView;
  }, [board, proposalBlocks]);

  const cardPages: CardPage[] = useMemo(() => {
    let cards =
      proposals
        ?.map((p) => {
          const page = pages[p?.id];
          const isStructuredProposal = !!p.formId;
          return {
            ...mapProposalToCardPage({
              proposal: p,
              proposalPage: page,
              spaceId: space?.id,
              createdAt: page?.createdAt.toString()
            }),
            isStructuredProposal,
            proposal: {
              archived: p.archived,
              currentEvaluationId: p.currentEvaluationId,
              id: p.id,
              status: p.status,
              currentStep: p.currentStep,
              sourceTemplateId: page?.sourceTemplateId,
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
    pages,
    proposals,
    space?.id
  ]);

  const boardCustomProperties: Board = getDefaultBoard({
    storedBoard: proposalBoardBlock,
    customOnly: true,
    evaluationStepTitles
  });

  // card from current proposal
  const { card } = mapProposalToCardPage({
    proposal,
    proposalPage,
    createdAt: proposalPage?.createdAt?.toString() || boardProposal?.createdAt,
    spaceId: space?.id || ''
  });

  // each proposal with fields reflects a card
  const cards: Card[] = cardPages.map((cp) => cp.card);

  const views: BoardView[] = [];

  return {
    board,
    boardCustomProperties,
    card,
    cards,
    cardPages,
    activeView,
    isLoading,
    refreshProposals: mutateProposals,
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
  createdAt = new Date().toString(),
  spaceId
}: {
  proposal: ProposalWithUsersLite | null;
  proposalPage?: PageMeta;
  createdAt?: string;
  spaceId?: string;
}) {
  const proposalFields: ProposalFields = proposal?.fields || { properties: {} };
  const proposalSpaceId = proposal?.spaceId || spaceId || '';
  proposalFields.properties = {
    ...proposalFields.properties,
    [Constants.titleColumnId]: proposalPage?.title || '',
    // add default field values on the fly
    [PROPOSAL_STATUS_BLOCK_ID]: proposal?.archived ? 'archived' : proposal?.currentStep?.result ?? 'in_progress',
    [AUTHORS_BLOCK_ID]: (proposal && 'authors' in proposal && proposal.authors?.map((a) => a.userId)) || '',
    [PROPOSAL_STEP_BLOCK_ID]: proposal?.currentStep?.title ?? 'Draft',
    [PROPOSAL_EVALUATION_TYPE_ID]: proposal?.currentStep?.step ?? 'draft',
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
    id: proposal?.id || '',
    spaceId: '',
    parentId: '',
    schema: 1,
    title: proposalPage?.title || '',
    rootId: proposalSpaceId,
    type: 'card' as BlockTypes,
    updatedBy: proposalPage?.updatedBy || '',
    createdBy: proposalPage?.createdBy || '',
    createdAt: new Date(createdAt).getTime(),
    updatedAt: proposalPage?.updatedAt ? new Date(proposalPage?.updatedAt).getTime() : 0,
    deletedAt: null,
    fields: { properties: {}, ...proposalFields, contentOrder: [] }
  };

  return { card, page: proposalPage };
}
