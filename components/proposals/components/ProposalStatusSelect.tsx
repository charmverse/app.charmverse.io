import { MenuItem, Select } from '@mui/material';
import { useMemo } from 'react';
import { mutate } from 'swr';

import { useSubmitEvaluationResult, useUpdateProposalStatusOnly } from 'charmClient/hooks/proposals';
import type { CardPageProposal } from 'lib/focalboard/card';
import { PROPOSAL_STATUS_ACTION_LABELS } from 'lib/focalboard/proposalDbProperties';
import type { ProposalEvaluationStatus } from 'lib/proposal/interface';

import { ProposalStatusChipTextOnly } from './ProposalStatusBadge';

export function ProposalStatusSelect({ proposal, spaceId }: { proposal: CardPageProposal; spaceId: string }) {
  const { trigger: submitEvaluationResult } = useSubmitEvaluationResult({ proposalId: proposal.id });
  const currentEvaluationStep = proposal.currentEvaluation?.step;
  const currentEvaluationStatus = proposal.currentEvaluation?.status;
  const currentEvaluationId = proposal.currentEvaluationId;
  const { trigger: updateProposalStatusOnly } = useUpdateProposalStatusOnly({ proposalId: proposal.id });

  const statusOptions: ProposalEvaluationStatus[] = useMemo(() => {
    if (currentEvaluationStep === 'draft') {
      return ['published'];
    } else if (currentEvaluationStep === 'rewards') {
      if (currentEvaluationStatus === 'unpublished') {
        return ['published'];
      }
    } else if (currentEvaluationStep === 'feedback') {
      if (currentEvaluationStatus === 'in_progress') {
        return ['complete'];
      }
    } else if (
      currentEvaluationStep === 'pass_fail' ||
      currentEvaluationStep === 'rubric' ||
      currentEvaluationStep === 'vote'
    ) {
      if (currentEvaluationStatus === 'in_progress') {
        return ['passed', 'declined'];
      } else if (currentEvaluationStatus === 'declined') {
        return ['passed'];
      }
    }
    return [];
  }, [currentEvaluationStep, currentEvaluationStatus]);

  async function onChange(status: ProposalEvaluationStatus) {
    if (currentEvaluationId) {
      await submitEvaluationResult({
        evaluationId: currentEvaluationId,
        result: status === 'complete' || status === 'passed' || status === 'published' ? 'pass' : 'fail'
      });
      await mutate(`/api/spaces/${spaceId}/proposals`);
    } else if (!currentEvaluationId && status === 'published') {
      await updateProposalStatusOnly({
        newStatus: 'published'
      });
      await mutate(`/api/spaces/${spaceId}/proposals`);
    }
  }

  return (
    <Select<string>
      size='small'
      displayEmpty
      value={currentEvaluationStatus ?? ''}
      onChange={(e) => onChange(e.target.value as ProposalEvaluationStatus)}
      renderValue={(status) => <ProposalStatusChipTextOnly status={status as ProposalEvaluationStatus} />}
      readOnly={statusOptions.length === 0}
    >
      {statusOptions.map((status) => {
        return (
          <MenuItem key={status} value={status}>
            <ProposalStatusChipTextOnly
              label={PROPOSAL_STATUS_ACTION_LABELS[status as ProposalEvaluationStatus]}
              size='small'
              status={status}
            />
          </MenuItem>
        );
      })}
    </Select>
  );
}
