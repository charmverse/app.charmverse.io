import type { ProposalEvaluationResult } from '@charmverse/core/prisma-client';
import { useMemo } from 'react';

import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { IPropertyOption } from 'lib/focalboard/board';
import {
  EVALUATION_STATUS_LABELS,
  EVALUATION_STATUS_VERB_LABELS,
  proposalStatusColors
} from 'lib/focalboard/proposalDbProperties';
import { getProposalEvaluationStatus } from 'lib/proposal/getProposalEvaluationStatus';
import type { ProposalEvaluationStatus, ProposalEvaluationStep, ProposalWithUsersLite } from 'lib/proposal/interface';

import { useBatchUpdateProposalStatusOrStep } from '../hooks/useBatchUpdateProposalStatusOrStep';

type ProposalProp = Pick<
  ProposalWithUsersLite,
  'currentStep' | 'currentEvaluationId' | 'evaluations' | 'id' | 'archived'
>;

export function ControlledProposalStatusSelect({
  proposal,
  onChange,
  readOnly
}: {
  readOnly?: boolean;
  proposal: ProposalProp;
  onChange: (result: ProposalEvaluationResult | null) => void;
}) {
  return <ProposalStatusSelectBase readOnly={readOnly} proposal={proposal} onChange={onChange} />;
}

export function ProposalStatusSelect({ proposal, readOnly }: { proposal: ProposalProp; readOnly?: boolean }) {
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

  return <ProposalStatusSelectBase proposal={proposal} onChange={onChange} readOnly={readOnly} />;
}

function ProposalStatusSelectBase({
  proposal,
  onChange,
  readOnly
}: {
  proposal: ProposalProp;
  onChange: (result: ProposalEvaluationResult | null) => void;
  readOnly?: boolean;
}) {
  const currentEvaluationStep = proposal.currentStep.step;
  const currentEvaluationResult = proposal.currentStep.result;
  const hasPublishedRewards = currentEvaluationStep === 'rewards' && currentEvaluationResult === 'pass';
  const lastEvaluation = proposal.evaluations[proposal.evaluations.length - 1];

  const statusOptions: ProposalEvaluationStatus[] = useMemo(() => {
    const evaluationStep = lastEvaluation && hasPublishedRewards ? lastEvaluation.type : currentEvaluationStep;

    if (evaluationStep === 'draft') {
      return ['published', 'unpublished'];
    } else if (evaluationStep === 'rewards') {
      return ['published', 'unpublished'];
    } else if (evaluationStep === 'feedback') {
      return ['complete', 'in_progress'];
    } else {
      // for vote, rubric, pass_fail, etc
      return ['passed', 'declined', 'in_progress'];
    }
  }, [currentEvaluationStep, lastEvaluation, hasPublishedRewards]);

  const options: IPropertyOption[] = statusOptions.map((status) => ({
    id: status,
    value: EVALUATION_STATUS_LABELS[status],
    dropdownValue: EVALUATION_STATUS_VERB_LABELS[status as ProposalEvaluationStatus],
    color: proposalStatusColors[status]
  }));

  return (
    <TagSelect
      wrapColumn
      readOnly={proposal.archived || readOnly || currentEvaluationStep === 'vote' || hasPublishedRewards}
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
          : hasPublishedRewards && lastEvaluation
          ? getProposalEvaluationStatus({
              result: 'pass',
              step: lastEvaluation.type as ProposalEvaluationStep
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
          status === 'complete' || status === 'passed' || status === 'published'
            ? 'pass'
            : status === 'declined' || status === 'unpublished'
            ? 'fail'
            : null
        );
      }}
    />
  );
}
