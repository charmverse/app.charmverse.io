import { MenuItem, Select } from '@mui/material';
import { useMemo } from 'react';
import { mutate } from 'swr';

import {
  useCreateProposalRewards,
  useSubmitEvaluationResult,
  useUpdateProposalStatusOnly
} from 'charmClient/hooks/proposals';
import { useSnackbar } from 'hooks/useSnackbar';
import type { CardPageProposal } from 'lib/focalboard/card';
import { PROPOSAL_STATUS_VERB_LABELS } from 'lib/focalboard/proposalDbProperties';
import { getProposalEvaluationStatus } from 'lib/proposal/getProposalEvaluationStatus';
import type { ProposalEvaluationStatus } from 'lib/proposal/interface';

import { ProposalStatusChipTextOnly } from './ProposalStatusBadge';

export function ProposalStatusSelect({ proposal, spaceId }: { proposal: CardPageProposal; spaceId: string }) {
  const { trigger: submitEvaluationResult } = useSubmitEvaluationResult({ proposalId: proposal.id });
  const currentEvaluationStep = proposal.currentStep.step;
  const currentEvaluationResult = proposal.currentStep.result;
  const currentEvaluationId = proposal.currentEvaluationId;
  const { trigger: updateProposalStatusOnly } = useUpdateProposalStatusOnly({ proposalId: proposal.id });
  const { trigger: createProposalRewards } = useCreateProposalRewards(proposal.id);
  const { showMessage } = useSnackbar();

  const statusOptions: ProposalEvaluationStatus[] = useMemo(() => {
    if (currentEvaluationStep === 'draft') {
      return ['published'];
    } else if (currentEvaluationStep === 'rewards') {
      if (currentEvaluationResult === null) {
        return ['published'];
      }
    } else if (currentEvaluationStep === 'feedback') {
      if (currentEvaluationResult === null) {
        return ['complete'];
      }
    } else if (currentEvaluationStep === 'pass_fail' || currentEvaluationStep === 'rubric') {
      if (currentEvaluationResult === null) {
        return ['passed', 'declined'];
      } else if (currentEvaluationResult === 'fail') {
        return ['passed'];
      }
    }
    return [];
  }, [currentEvaluationStep, currentEvaluationResult]);

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

  return (
    <Select<string>
      size='small'
      displayEmpty
      value={getProposalEvaluationStatus({
        proposalStep: proposal.currentStep
      })}
      onChange={(e) => onChange(e.target.value as ProposalEvaluationStatus)}
      renderValue={(status) => <ProposalStatusChipTextOnly status={status as ProposalEvaluationStatus} />}
      readOnly={statusOptions.length === 0}
    >
      {statusOptions.map((status) => {
        return (
          <MenuItem key={status} value={status}>
            <ProposalStatusChipTextOnly
              label={PROPOSAL_STATUS_VERB_LABELS[status as ProposalEvaluationStatus]}
              size='small'
              status={status}
            />
          </MenuItem>
        );
      })}
    </Select>
  );
}
