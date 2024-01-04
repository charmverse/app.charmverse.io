import { Chip, MenuItem, Select } from '@mui/material';
import { mutate } from 'swr';

import { useClearEvaluationResult, useUpdateProposalStatusOnly } from 'charmClient/hooks/proposals';
import { useSnackbar } from 'hooks/useSnackbar';
import type { CardPageProposal } from 'lib/focalboard/card';

import { ProposalStepChipTextOnly } from './ProposalStepBadge';

export function ProposalStepSelect({ proposal, spaceId }: { proposal: CardPageProposal; spaceId: string }) {
  const { trigger: updateProposalStatusOnly } = useUpdateProposalStatusOnly({ proposalId: proposal.id });
  const { trigger: clearEvaluationResult } = useClearEvaluationResult({ proposalId: proposal.id });
  const evaluations = [
    {
      id: 'draft',
      title: 'Draft'
    },
    ...proposal.evaluations,
    ...(proposal.hasRewards
      ? [
          {
            id: 'rewards',
            title: 'Rewards'
          }
        ]
      : [])
  ];

  const lastEvaluation = proposal.evaluations[proposal.evaluations.length - 1];
  const { showMessage } = useSnackbar();

  const currentEvaluationId = proposal.currentEvaluationId;
  const currentEvaluationIndex =
    currentEvaluationId === null
      ? 0
      : currentEvaluationId === lastEvaluation.id && lastEvaluation.result === 'pass' && proposal.hasRewards
      ? evaluations.length - 1
      : evaluations.findIndex((evaluation) => evaluation.id === currentEvaluationId);

  async function onChange(evaluationId?: string) {
    try {
      if (evaluationId !== 'draft') {
        await clearEvaluationResult({
          evaluationId
        });
      } else {
        await updateProposalStatusOnly({
          newStatus: 'draft'
        });
      }
      await mutate(`/api/spaces/${spaceId}/proposals`);
    } catch (err: any) {
      showMessage(err.message, 'error');
    }
  }

  return (
    <Select<string>
      size='small'
      displayEmpty
      value={proposal.currentEvaluationId ?? ''}
      onChange={(e) => onChange(e.target.value)}
      renderValue={() => {
        const currentEvaluationTitle = proposal.currentEvaluation?.title ?? 'Draft';
        return <ProposalStepChipTextOnly label={currentEvaluationTitle} />;
      }}
    >
      {evaluations.map((evaluation, index) => {
        return (
          <MenuItem
            disabled={index >= currentEvaluationIndex || index < currentEvaluationIndex - 1}
            key={evaluation.id}
            value={evaluation.id}
          >
            <Chip size='small' label={evaluation.title} color='gray' />
          </MenuItem>
        );
      })}
    </Select>
  );
}
