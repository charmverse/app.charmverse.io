import type { ProposalEvaluationResult, ProposalSystemRole } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Stack, Typography } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';
import { useMemo, useState } from 'react';
import { mutate } from 'swr';

import charmClient from 'charmClient';
import type { SelectOption } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { useProposals } from 'components/proposals/hooks/useProposals';
import { useProposalUpdateStatusAndStep } from 'components/proposals/hooks/useProposalUpdateStatusAndStep';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePages } from 'hooks/usePages';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';
import { Constants } from 'lib/focalboard/constants';
import type { ProposalEvaluationStep } from 'lib/proposal/interface';
import { isTruthy } from 'lib/utilities/types';

import mutator from '../../../mutator';

import { StyledMenuItem } from './PropertyMenu';
import { PropertyTemplateMenu } from './PropertyTemplateMenu';

const StyledStack = styled(Stack)`
  flex-direction: row;
  align-items: center;
  z-index: 1;
  overflow: auto;
  width: 100%;
  margin-right: 8px;

  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const validPropertyTypes = [
  'checkbox',
  'text',
  'number',
  'date',
  'multiSelect',
  'select',
  'url',
  'email',
  'phone',
  'person',
  'proposalAuthor',
  'proposalReviewer',
  'proposalStep',
  'proposalStatus'
] as PropertyType[];

export function ViewHeaderRowsMenu({
  cards,
  checkedIds,
  setCheckedIds,
  board,
  propertyTemplates,
  onChange,
  onDelete
}: {
  board: Board;
  cards: Card[];
  setCheckedIds: Dispatch<SetStateAction<string[]>>;
  checkedIds: string[];
  propertyTemplates: IPropertyTemplate<PropertyType>[];
  onChange?: VoidFunction;
  onDelete?: (pageIds: string[]) => Promise<void>;
}) {
  const { pages } = usePages();
  const isAdmin = useIsAdmin();
  const { proposalsMap } = useProposals();
  const { space } = useCurrentSpace();
  const [isDeleting, setIsDeleting] = useState(false);
  const { batchUpdateProposalStatuses, batchUpdateProposalSteps } = useProposalUpdateStatusAndStep();

  async function deleteCheckedCards() {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(checkedIds);
      } else {
        await mutator.deleteBlocks(checkedIds, 'delete cards');
      }
    } catch (_) {
      //
    } finally {
      setCheckedIds([]);
      setIsDeleting(false);
    }
  }

  async function onProposalAuthorSelect(pageIds: string[], authorIds: string[]) {
    for (const pageId of pageIds) {
      const proposalId = pages[pageId]?.proposalId;
      if (proposalId) {
        try {
          await charmClient.proposals.updateProposal({
            authors: authorIds,
            proposalId
          });
        } catch (err) {
          //
        }
      }
    }
  }

  const { isStepDisabled, isStatusDisabled, isReviewersDisabled } = useMemo(() => {
    const checkedPages = checkedIds.map((id) => pages[id]).filter(isTruthy);
    const firstProposal = proposalsMap[checkedPages[0]?.proposalId ?? ''];
    const _isReviewerDisabled = checkedPages.some((checkedPage) => {
      const proposal = proposalsMap[checkedPage.proposalId ?? ''];
      return (
        !proposal ||
        proposal.currentStep.step === 'draft' ||
        proposal.currentStep.step === 'feedback' ||
        checkedPage.sourceTemplateId
      );
    });

    const _isStatusDisabled =
      !firstProposal ||
      checkedPages.some((checkedPage) => {
        const proposal = proposalsMap[checkedPage.proposalId ?? ''];
        return !proposal || proposal.currentStep.step !== firstProposal.currentStep.step;
      });

    const _isStepDisabled =
      !firstProposal ||
      checkedPages.some((checkedPage) => {
        const proposal = proposalsMap[checkedPage.proposalId ?? ''];
        return (
          !proposal ||
          proposal.evaluations.length !== firstProposal.evaluations.length ||
          proposal.evaluations.some((evaluation, index) => {
            const firstProposalEvaluation = firstProposal.evaluations[index];
            return (
              evaluation.type !== firstProposalEvaluation.type || evaluation.title !== firstProposalEvaluation.title
            );
          })
        );
      });

    return {
      isStepDisabled: _isStepDisabled,
      isStatusDisabled: _isStatusDisabled,
      isReviewersDisabled: _isReviewerDisabled
    };
  }, [pages, checkedIds, proposalsMap]);

  async function onProposalReviewerSelect(pageIds: string[], reviewers: SelectOption[]) {
    let proposalReviewersChanged = false;
    for (const pageId of pageIds) {
      const page = pages[pageId];
      const proposalId = page?.proposalId;
      const proposal = proposalId ? proposalsMap[proposalId] : null;
      const proposalWithEvaluationId = proposal?.currentEvaluationId;
      if (proposal && proposalWithEvaluationId) {
        await charmClient.proposals.updateProposalEvaluation({
          reviewers: reviewers.map((reviewer) => ({
            roleId: reviewer.group === 'role' ? reviewer.id : null,
            systemRole: reviewer.group === 'system_role' ? (reviewer.id as ProposalSystemRole) : null,
            userId: reviewer.group === 'user' ? reviewer.id : null
          })),
          proposalId: proposal.id,
          evaluationId: proposalWithEvaluationId
        });
        proposalReviewersChanged = true;
      }
    }
    if (proposalReviewersChanged) {
      await mutate(`/api/spaces/${board.spaceId}/proposals`);
    }
  }

  async function onProposalStatusUpdate(pageIds: string[], result: ProposalEvaluationResult) {
    if (pageIds.length === 0) {
      return;
    }

    const firstProposal = proposalsMap[pages[pageIds[0]]?.proposalId ?? ''];

    if (!firstProposal) {
      return;
    }

    const proposalsData: {
      proposalId: string;
      evaluationId?: string;
    }[] = [];

    pageIds.forEach((pageId) => {
      const proposal = proposalsMap[pages[pageId]?.proposalId ?? ''];
      if (proposal?.currentStep.step === firstProposal.currentStep.step) {
        proposalsData.push({
          proposalId: proposal.id,
          evaluationId: proposal.currentEvaluationId
        });
      }
    });

    if (proposalsData.length) {
      await batchUpdateProposalStatuses({
        proposalsData,
        result,
        currentEvaluationStep: firstProposal.currentStep.step
      });
    }
  }

  async function onProposalStepUpdate(pageIds: string[], evaluationId: string, moveForward: boolean) {
    if (pageIds.length === 0) {
      return;
    }

    const firstProposal = proposalsMap[pages[pageIds[0]]?.proposalId ?? ''];

    if (!firstProposal) {
      return;
    }

    const evaluationIndex = firstProposal.evaluations.findIndex((evaluation) => evaluation.id === evaluationId);

    const proposalsData: {
      proposalId: string;
      evaluationId: string;
      currentEvaluationStep: ProposalEvaluationStep;
    }[] = [];

    pageIds.forEach((pageId) => {
      const proposal = proposalsMap[pages[pageId]?.proposalId ?? ''];
      if (proposal) {
        if (
          (evaluationId === 'rewards' &&
            ((proposal.fields?.pendingRewards ?? []).length > 0 || (proposal.rewardIds ?? [])?.length > 0)) ||
          evaluationId !== 'rewards'
        ) {
          proposalsData.push({
            proposalId: proposal.id,
            evaluationId: evaluationId === 'draft' ? evaluationId : proposal.evaluations[evaluationIndex].id,
            currentEvaluationStep: proposal.currentStep.step
          });
        }
      }
    });

    if (proposalsData.length) {
      await batchUpdateProposalSteps(proposalsData, moveForward);
    }
  }

  const filteredPropertyTemplates = useMemo(() => {
    return propertyTemplates.filter(
      (propertyTemplate) =>
        !propertyTemplate.formFieldId &&
        validPropertyTypes.includes(propertyTemplate.type) &&
        propertyTemplate.id !== Constants.titleColumnId
    );
  }, [propertyTemplates]);

  const firstCheckedProposal = useMemo(() => {
    let firstCheckedProposalId;
    for (const checkedId of checkedIds) {
      const proposalId = pages[checkedId]?.proposalId;
      if (proposalId) {
        firstCheckedProposalId = proposalId;
        break;
      }
    }
    return firstCheckedProposalId ? proposalsMap[firstCheckedProposalId] : undefined;
  }, [checkedIds, pages, proposalsMap]);

  if (!space) {
    return null;
  }

  return (
    <StyledStack>
      <StyledMenuItem>
        <Typography onClick={() => setCheckedIds([])} color='primary' variant='body2'>
          {checkedIds.length} selected
        </Typography>
      </StyledMenuItem>
      {cards.length !== 0
        ? filteredPropertyTemplates.map((propertyTemplate) => (
            <PropertyTemplateMenu
              isAdmin={isAdmin}
              board={board}
              checkedIds={checkedIds}
              cards={cards}
              propertyTemplate={propertyTemplate}
              key={propertyTemplate.id}
              onChange={onChange}
              firstCheckedProposal={firstCheckedProposal}
              onProposalAuthorSelect={onProposalAuthorSelect}
              onProposalReviewerSelect={onProposalReviewerSelect}
              onProposalStatusUpdate={onProposalStatusUpdate}
              onProposalStepUpdate={onProposalStepUpdate}
              disabled={
                propertyTemplate.type === 'proposalStep'
                  ? isStepDisabled
                  : propertyTemplate.type === 'proposalStatus'
                  ? isStatusDisabled
                  : propertyTemplate.type === 'proposalReviewer'
                  ? isReviewersDisabled
                  : false
              }
            />
          ))
        : null}
      <StyledMenuItem onClick={deleteCheckedCards} disabled={isDeleting}>
        <DeleteOutlinedIcon fontSize='small' />
      </StyledMenuItem>
    </StyledStack>
  );
}
