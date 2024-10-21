import type { ProposalEvaluationResult } from '@charmverse/core/prisma-client';
import { useMemo } from 'react';

import { TagSelect } from 'components/common/DatabaseEditor/components/properties/TagSelect/TagSelect';
import type { PropertyValueDisplayType } from 'components/common/DatabaseEditor/interfaces';
import type { IPropertyOption } from 'lib/databases/board';
import {
  EVALUATION_STATUS_LABELS,
  EVALUATION_STATUS_VERB_LABELS,
  proposalStatusColors
} from 'lib/databases/proposalDbProperties';
import { getFeatureTitle } from 'lib/features/getFeatureTitle';
import { getProposalEvaluationStatus } from 'lib/proposals/getProposalEvaluationStatus';
import type { ProposalWithUsersLite } from 'lib/proposals/getProposals';
import type { ProposalEvaluationStatus } from 'lib/proposals/interfaces';

import { useBatchUpdateProposalStatusOrStep } from '../hooks/useBatchUpdateProposalStatusOrStep';

type ProposalProp = Pick<
  ProposalWithUsersLite,
  'currentStep' | 'currentEvaluationId' | 'evaluations' | 'id' | 'archived'
>;

export function ControlledProposalStatusSelect({
  proposal,
  onChange,
  readOnly,
  displayType
}: {
  readOnly?: boolean;
  proposal: ProposalProp;
  onChange: (result: ProposalEvaluationResult | null) => void;
  displayType?: PropertyValueDisplayType;
}) {
  return (
    <ProposalStatusSelectBase readOnly={readOnly} proposal={proposal} onChange={onChange} displayType={displayType} />
  );
}

export function ProposalStatusSelect({
  proposal,
  readOnly,
  displayType
}: {
  proposal: ProposalProp;
  readOnly?: boolean;
  displayType?: PropertyValueDisplayType;
}) {
  const currentEvaluationStep = proposal.currentStep.step;
  const currentEvaluationId = proposal.currentStep.id;
  const { updateStatuses } = useBatchUpdateProposalStatusOrStep();

  async function onChange(result: ProposalEvaluationResult | null) {
    updateStatuses({
      proposalsData: [
        {
          proposalId: proposal.id,
          evaluationId: currentEvaluationId
        }
      ],
      result,
      currentEvaluationStep
    });
  }

  return (
    <ProposalStatusSelectBase proposal={proposal} onChange={onChange} readOnly={readOnly} displayType={displayType} />
  );
}

function ProposalStatusSelectBase({
  proposal,
  onChange,
  readOnly,
  displayType
}: {
  proposal: ProposalProp;
  onChange: (result: ProposalEvaluationResult | null) => void;
  readOnly?: boolean;
  displayType?: PropertyValueDisplayType;
}) {
  const currentEvaluationStep = proposal.currentStep.step;
  const currentEvaluationStepRequiredReviews = proposal.currentStep.requiredReviews;
  const currentEvaluationResult = proposal.currentStep.result;
  const hasPublishedRewards = currentEvaluationStep === 'rewards' && currentEvaluationResult === 'pass';

  const statusOptions: ProposalEvaluationStatus[] = useMemo(() => {
    if (currentEvaluationStep === 'draft') {
      return ['passed', 'draft'];
    } else if (currentEvaluationStep === 'rewards') {
      return ['published', 'unpublished'];
    } else if (currentEvaluationStep === 'credentials') {
      return ['issued', 'not_issued'];
    } else if (currentEvaluationStep === 'feedback') {
      return ['passed', 'in_progress'];
    } else {
      // for vote, rubric, pass_fail, etc
      return ['passed', 'declined', 'in_progress'];
    }
  }, [currentEvaluationStep]);

  const options: IPropertyOption[] = statusOptions.map((status) => {
    const statusLabel = EVALUATION_STATUS_LABELS[status];

    return {
      id: status,
      value: statusLabel,
      dropdownValue: EVALUATION_STATUS_VERB_LABELS[status as ProposalEvaluationStatus],
      color: proposalStatusColors[status]
    };
  });

  return (
    <TagSelect
      displayType={displayType}
      wrapColumn
      readOnly={
        proposal.archived ||
        readOnly ||
        currentEvaluationStep === 'vote' ||
        hasPublishedRewards ||
        currentEvaluationStep === 'credentials' ||
        (currentEvaluationStep === 'pass_fail' && currentEvaluationStepRequiredReviews !== 1)
      }
      options={
        proposal.archived
          ? [
              {
                id: 'archived',
                value: 'Archived',
                dropdownValue: 'Archived',
                color: 'gray'
              }
            ]
          : options
      }
      propertyValue={
        proposal.archived
          ? 'archived'
          : hasPublishedRewards
            ? getProposalEvaluationStatus({
                result: 'pass',
                step: 'rewards'
              })
            : proposal
              ? getProposalEvaluationStatus({
                  result: proposal.currentStep.result ?? 'in_progress',
                  step: proposal.currentStep.step
                })
              : 'in_progress'
      }
      disableClearable
      onChange={(status) => {
        onChange(
          status === 'complete' || status === 'passed' || status === 'published' || status === 'issued'
            ? 'pass'
            : status === 'declined' || status === 'unpublished' || status === 'draft' || status === 'not_issued'
              ? 'fail'
              : null
        );
      }}
    />
  );
}
