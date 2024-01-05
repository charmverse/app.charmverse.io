import { useMemo } from 'react';

import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { IPropertyOption } from 'lib/focalboard/board';
import {
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_VERB_LABELS,
  proposalStatusColors
} from 'lib/focalboard/proposalDbProperties';
import { getProposalEvaluationStatus } from 'lib/proposal/getProposalEvaluationStatus';
import type { ProposalEvaluationStatus, ProposalWithUsersLite } from 'lib/proposal/interface';

import { useProposalUpdateStatusAndStep } from '../hooks/useProposalUpdateStatusAndStep';

export function ControlledProposalStatusSelect({
  proposal,
  onChange
}: {
  proposal: Pick<ProposalWithUsersLite, 'currentStep' | 'currentEvaluationId'>;
  onChange: (status: ProposalEvaluationStatus) => void;
}) {
  return <ProposalStatusSelectBase proposal={proposal} onChange={onChange} readOnly={false} />;
}

export function ProposalStatusSelect({
  proposal,
  readOnly
}: {
  proposal: Pick<ProposalWithUsersLite, 'currentStep' | 'currentEvaluationId' | 'id'>;
  readOnly?: boolean;
}) {
  const currentEvaluationStep = proposal.currentStep.step;
  const currentEvaluationId = proposal.currentEvaluationId;
  const { updateProposalStatus } = useProposalUpdateStatusAndStep();

  async function onChange(status: ProposalEvaluationStatus) {
    updateProposalStatus({
      proposalsData: [
        {
          proposalId: proposal.id,
          evaluationId: currentEvaluationId
        }
      ],
      status,
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
  proposal: Pick<ProposalWithUsersLite, 'currentStep' | 'currentEvaluationId'>;
  onChange: (status: ProposalEvaluationStatus) => void;
  readOnly?: boolean;
}) {
  const currentEvaluationStep = proposal.currentStep.step;
  const currentEvaluationResult = proposal.currentStep.result;
  const statusOptions: ProposalEvaluationStatus[] = useMemo(() => {
    if (currentEvaluationStep === 'draft') {
      return ['published', 'unpublished'];
    } else if (currentEvaluationStep === 'rewards') {
      return ['published', 'unpublished'];
    } else if (currentEvaluationStep === 'feedback') {
      return ['complete', 'in_progress'];
    } else {
      // for vote, rubric, pass_fail, etc
      return ['passed', 'declined', 'in_progress'];
    }
  }, [currentEvaluationStep]);

  const options: IPropertyOption[] = statusOptions.map((status) => ({
    id: status,
    value: PROPOSAL_STATUS_LABELS[status],
    dropdownValue: PROPOSAL_STATUS_VERB_LABELS[status as ProposalEvaluationStatus],
    color: proposalStatusColors[status],
    disabled: status === 'in_progress'
  }));

  return (
    <TagSelect
      wrapColumn
      readOnly={
        readOnly ||
        currentEvaluationStep === 'vote' ||
        (currentEvaluationResult === 'pass' && currentEvaluationStep === 'rewards')
      }
      options={options}
      propertyValue={
        proposal
          ? getProposalEvaluationStatus({
              result: proposal.currentStep.result ?? 'in_progress',
              step: proposal.currentStep.step
            })
          : ''
      }
      disableClearable
      onChange={(newValue) => onChange(newValue as ProposalEvaluationStatus)}
    />
  );
}
