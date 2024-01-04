import { useMemo } from 'react';
import { mutate } from 'swr';

import {
  useCreateProposalRewards,
  useSubmitEvaluationResult,
  useUpdateProposalStatusOnly
} from 'charmClient/hooks/proposals';
import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { useSnackbar } from 'hooks/useSnackbar';
import type { IPropertyOption } from 'lib/focalboard/board';
import type { CardPageProposal } from 'lib/focalboard/card';
import { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_VERB_LABELS } from 'lib/focalboard/proposalDbProperties';
import { getProposalEvaluationStatus } from 'lib/proposal/getProposalEvaluationStatus';
import type { ProposalEvaluationStatus } from 'lib/proposal/interface';
import type { BrandColor } from 'theme/colors';

const statusColors: Record<ProposalEvaluationStatus, BrandColor> = {
  complete: 'green',
  declined: 'red',
  in_progress: 'yellow',
  passed: 'green',
  published: 'green',
  unpublished: 'gray'
};

export function ProposalStatusSelect({
  proposal,
  spaceId,
  readOnly
}: {
  proposal: CardPageProposal;
  spaceId: string;
  readOnly?: boolean;
}) {
  const { trigger: submitEvaluationResult } = useSubmitEvaluationResult({ proposalId: proposal.id });
  const currentEvaluationStep = proposal.currentStep.step;
  const currentEvaluationId = proposal.currentEvaluationId;
  const { trigger: updateProposalStatusOnly } = useUpdateProposalStatusOnly({ proposalId: proposal.id });
  const { trigger: createProposalRewards } = useCreateProposalRewards(proposal.id);
  const { showMessage } = useSnackbar();

  const statusOptions: ProposalEvaluationStatus[] = useMemo(() => {
    if (currentEvaluationStep === 'draft') {
      return ['unpublished', 'published'];
    } else if (currentEvaluationStep === 'rewards') {
      return ['unpublished', 'published'];
    } else if (currentEvaluationStep === 'feedback') {
      return ['in_progress', 'complete'];
    } else if (currentEvaluationStep === 'pass_fail' || currentEvaluationStep === 'rubric') {
      return ['in_progress', 'passed', 'declined'];
    }
    return [];
  }, [currentEvaluationStep]);

  async function onChange(status: ProposalEvaluationStatus) {
    try {
      if (currentEvaluationStep === 'rewards') {
        await createProposalRewards();
        await mutate(`/api/spaces/${spaceId}/proposals`);
      } else if (currentEvaluationStep === 'draft' && status === 'published') {
        await updateProposalStatusOnly({
          newStatus: 'published'
        });
        await mutate(`/api/spaces/${spaceId}/proposals`);
      } else if (currentEvaluationId) {
        await submitEvaluationResult({
          evaluationId: currentEvaluationId,
          result: status === 'complete' || status === 'passed' ? 'pass' : 'fail'
        });
        await mutate(`/api/spaces/${spaceId}/proposals`);
      }
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  }

  const options: IPropertyOption[] = statusOptions.map((status) => ({
    id: status,
    value: PROPOSAL_STATUS_LABELS[status],
    dropdownValue: PROPOSAL_STATUS_VERB_LABELS[status as ProposalEvaluationStatus],
    color: statusColors[status]
  }));

  return (
    <TagSelect
      wrapColumn
      readOnly={readOnly || statusOptions.length === 0}
      options={options}
      propertyValue={getProposalEvaluationStatus({
        proposalStep: proposal.currentStep
      })}
      onChange={(newValue) => onChange(newValue as ProposalEvaluationStatus)}
    />
  );
}
