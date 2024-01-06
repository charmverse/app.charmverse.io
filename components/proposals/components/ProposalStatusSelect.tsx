import type { ProposalEvaluationResult } from '@charmverse/core/dist/cjs/prisma-client';
import { useMemo } from 'react';

import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { IPropertyOption } from 'lib/focalboard/board';
import {
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_VERB_LABELS,
  proposalStatusColors
} from 'lib/focalboard/proposalDbProperties';
import { getProposalEvaluationStatus } from 'lib/proposal/getProposalEvaluationStatus';
import type { ProposalEvaluationStatus, ProposalEvaluationStep, ProposalWithUsersLite } from 'lib/proposal/interface';

import { useProposalUpdateStatusAndStep } from '../hooks/useProposalUpdateStatusAndStep';

type ProposalProp = Pick<ProposalWithUsersLite, 'currentStep' | 'currentEvaluationId' | 'evaluations' | 'id'>;

export function ControlledProposalStatusSelect({
  proposal,
  onChange
}: {
  proposal: ProposalProp;
  onChange: (result: ProposalEvaluationResult | null) => void;
}) {
  return <ProposalStatusSelectBase proposal={proposal} onChange={onChange} readOnly={false} />;
}

export function ProposalStatusSelect({ proposal, readOnly }: { proposal: ProposalProp; readOnly?: boolean }) {
  const currentEvaluationStep = proposal.currentStep.step;
  const currentEvaluationId = proposal.currentStep.id;
  const { batchUpdateProposalStatuses } = useProposalUpdateStatusAndStep();

  async function onChange(result: ProposalEvaluationResult | null) {
    batchUpdateProposalStatuses({
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
    value: PROPOSAL_STATUS_LABELS[status],
    dropdownValue: PROPOSAL_STATUS_VERB_LABELS[status as ProposalEvaluationStatus],
    color: proposalStatusColors[status]
  }));

  return (
    <TagSelect
      wrapColumn
      readOnly={readOnly || currentEvaluationStep === 'vote' || hasPublishedRewards}
      options={options}
      propertyValue={
        hasPublishedRewards && lastEvaluation
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
