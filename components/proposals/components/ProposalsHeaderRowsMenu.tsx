import type { ProposalEvaluationResult, ProposalSystemRole } from '@charmverse/core/prisma';
import { isTruthy } from '@packages/lib/utils/types';
import { useMemo } from 'react';

import charmClient from 'charmClient';
import { useArchiveProposals } from 'charmClient/hooks/proposals';
import type { SelectOption } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import type { ViewHeaderRowsMenuProps } from 'components/common/DatabaseEditor/components/viewHeader/ViewHeaderRowsMenu/ViewHeaderRowsMenu';
import { ViewHeaderRowsMenu } from 'components/common/DatabaseEditor/components/viewHeader/ViewHeaderRowsMenu/ViewHeaderRowsMenu';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useSnackbar } from 'hooks/useSnackbar';
import type { IPropertyTemplate, PropertyType } from 'lib/databases/board';
import type { ProposalEvaluationStep } from 'lib/proposals/interfaces';

import { useBatchUpdateProposalStatusOrStep } from '../hooks/useBatchUpdateProposalStatusOrStep';
import { useProposals } from '../hooks/useProposals';

type Props = Pick<ViewHeaderRowsMenuProps, 'checkedIds' | 'setCheckedIds' | 'cards' | 'board' | 'onChange' | 'sx'> & {
  visiblePropertyIds?: string[];
  refreshProposals: () => Promise<any>;
};
export function ProposalsHeaderRowsMenu({
  board,
  visiblePropertyIds,
  cards,
  checkedIds,
  setCheckedIds,
  refreshProposals,
  sx
}: Props) {
  const { showError } = useSnackbar();
  const { showConfirmation } = useConfirmationModal();
  const { proposalsMap } = useProposals();
  const { updateStatuses, updateSteps } = useBatchUpdateProposalStatusOrStep();
  const { trigger: archiveProposals } = useArchiveProposals();

  let propertyTemplates: IPropertyTemplate<PropertyType>[] = [];

  if (visiblePropertyIds?.length) {
    visiblePropertyIds.forEach((propertyId) => {
      const property = board.fields.cardProperties.find((p) => p.id === propertyId);
      if (property) {
        propertyTemplates.push(property);
      }
    });
  } else {
    propertyTemplates = [...board.fields.cardProperties];
  }

  async function onChangeProposalsReviewers(proposalIds: string[], reviewers: SelectOption[]) {
    let proposalReviewersChanged = false;
    for (const proposalId of proposalIds) {
      const proposal = proposalId ? proposalsMap[proposalId] : null;
      const proposalWithEvaluationId = proposal?.currentEvaluationId;
      if (proposal && proposalWithEvaluationId && !proposal.archived) {
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
      try {
        await refreshProposals();
      } catch (error) {
        showError(error, 'There was an error updating reviewers');
      }
    }
  }

  async function onChangeProposalsStatuses(proposalIds: string[], result: ProposalEvaluationResult | null) {
    if (proposalIds.length === 0) {
      return;
    }

    const firstProposal = proposalsMap[proposalIds[0]];

    if (!firstProposal) {
      return;
    }

    const proposalsData: {
      proposalId: string;
      evaluationId?: string;
    }[] = [];

    proposalIds.forEach((proposalId) => {
      const proposal = proposalsMap[proposalId];
      const proposalEvaluation = proposal?.evaluations.find(
        (evaluation) => evaluation.id === proposal.currentEvaluationId
      );

      if (
        proposal?.currentStep.step === firstProposal.currentStep.step &&
        !proposal.archived &&
        proposalEvaluation &&
        !(proposalEvaluation?.type === 'pass_fail' && proposalEvaluation.requiredReviews > 1)
      ) {
        proposalsData.push({
          proposalId: proposal.id,
          evaluationId: proposal.currentEvaluationId
        });
      }
    });

    if (proposalsData.length) {
      try {
        await updateStatuses({
          proposalsData,
          result,
          currentEvaluationStep: firstProposal.currentStep.step
        });
      } catch (error) {
        showError(error, 'There was an error updating statuses');
      }
    }
  }

  async function onChangeProposalsSteps(proposalIds: string[], evaluationId: string, moveForward: boolean) {
    if (proposalIds.length === 0) {
      return;
    }

    const firstProposal = proposalsMap[proposalIds[0]];

    if (!firstProposal) {
      return;
    }

    const evaluationIndex = firstProposal.evaluations.findIndex((evaluation) => evaluation.id === evaluationId);

    const proposalsData: {
      proposalId: string;
      evaluationId: string;
      currentEvaluationStep: ProposalEvaluationStep;
    }[] = [];

    proposalIds.forEach((proposalId) => {
      const proposal = proposalsMap[proposalId];
      if (proposal && !proposal.archived) {
        const proposalEvaluation = proposal.evaluations.find(
          (evaluation) => evaluation.id === proposal.currentEvaluationId
        );
        if (
          (evaluationId === 'rewards' &&
            ((proposal.fields?.pendingRewards ?? []).length > 0 || (proposal.rewardIds ?? [])?.length > 0)) ||
          (evaluationId !== 'rewards' &&
            proposalEvaluation &&
            !(
              proposalEvaluation.type === 'pass_fail' &&
              proposalEvaluation.requiredReviews > 1 &&
              evaluationId !== 'draft'
            ))
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
      try {
        await updateSteps(proposalsData, moveForward);
      } catch (error) {
        showError(error, 'There was an error updating steps');
      }
    }
  }

  async function onChangeProposalsAuthors(proposalIds: string[], authorIds: string[]) {
    for (const proposalId of proposalIds) {
      const proposal = proposalId ? proposalsMap[proposalId] : null;
      if (proposalId && !proposal?.archived) {
        try {
          await charmClient.proposals.updateProposal({
            authors: authorIds,
            proposalId
          });
          await refreshProposals();
        } catch (error) {
          showError(error, 'There was an error updating authors');
        }
      }
    }
  }

  const { isStepDisabled, isStatusDisabled, isReviewersDisabled } = useMemo(() => {
    const checkedProposals = checkedIds.map((id) => proposalsMap[id]).filter(isTruthy);
    const firstProposal = checkedProposals[0];
    const _isReviewerDisabled = checkedProposals.some((proposal) => {
      return proposal.archived || proposal.currentStep.step === 'draft';
    });

    const _isStatusDisabled =
      !firstProposal ||
      checkedProposals.some((proposal) => {
        return proposal.archived || proposal.currentStep.step !== firstProposal.currentStep.step;
      });

    const _isStepDisabled =
      !firstProposal ||
      checkedProposals.some((proposal) => {
        return (
          proposal.archived ||
          proposal.evaluations.length !== firstProposal.evaluations.length ||
          // Check if all evaluations are in the same workflow
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
  }, [checkedIds, proposalsMap]);

  async function onArchiveProposals(archived: boolean) {
    if (archived) {
      const { confirmed } = await showConfirmation('Are you sure you want to archive these proposals?');
      if (!confirmed) {
        return;
      }
    }
    try {
      await archiveProposals({ archived, proposalIds: checkedIds });
    } catch (error) {
      showError(error);
    }
  }

  const firstCheckedProposal = useMemo(() => {
    let firstCheckedProposalId;
    for (const proposalId of checkedIds) {
      if (proposalId) {
        firstCheckedProposalId = proposalId;
        break;
      }
    }
    return firstCheckedProposalId ? proposalsMap[firstCheckedProposalId] : undefined;
  }, [checkedIds, proposalsMap]);

  return (
    <ViewHeaderRowsMenu
      board={board}
      cards={cards}
      checkedIds={checkedIds}
      setCheckedIds={setCheckedIds}
      propertyTemplates={propertyTemplates}
      onChange={refreshProposals}
      firstCheckedProposal={firstCheckedProposal}
      isStepDisabled={isStepDisabled}
      isStatusDisabled={isStatusDisabled}
      isReviewersDisabled={isReviewersDisabled}
      onChangeProposalsAuthors={onChangeProposalsAuthors}
      onChangeProposalsReviewers={onChangeProposalsReviewers}
      onChangeProposalsStatuses={onChangeProposalsStatuses}
      onChangeProposalsSteps={onChangeProposalsSteps}
      onArchiveProposals={onArchiveProposals}
      showIssueProposalCredentials
      onIssueCredentialsSuccess={refreshProposals}
      sx={sx}
    />
  );
}
