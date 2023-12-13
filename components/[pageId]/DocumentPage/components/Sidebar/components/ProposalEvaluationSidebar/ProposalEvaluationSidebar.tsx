import { Edit as EditIcon } from '@mui/icons-material';
import { Box, Divider, IconButton, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { evaluationIcons } from 'components/settings/proposals/constants';
import type { ProposalWithUsersAndRubric, PopulatedEvaluation } from 'lib/proposal/interface';
import { getCurrentEvaluation } from 'lib/proposal/workflows/getCurrentEvaluation';

import { FeedbackEvaluation } from './components/FeedbackEvaluation';
import { PassFailEvaluation } from './components/PassFailEvaluation';
import { RubricEvaluation } from './components/RubricEvaluation';

export type Props = {
  pageId?: string;
  proposal?: Pick<ProposalWithUsersAndRubric, 'id' | 'authors' | 'evaluations' | 'status' | 'evaluationType'>;
  evaluationId?: string | null;
  refreshProposal?: VoidFunction;
  goToEditProposal: VoidFunction;
};

export function ProposalEvaluationSidebar({
  pageId,
  proposal,
  evaluationId = null,
  refreshProposal,
  goToEditProposal
}: Props) {
  const [activeEvaluationId, setActiveEvaluationId] = useState<string | null>(evaluationId);
  const currentEvaluation = getCurrentEvaluation(proposal?.evaluations || []);

  const evaluation = proposal?.evaluations.find((e) => e.id === activeEvaluationId);

  useEffect(() => {
    setActiveEvaluationId(evaluationId);
  }, [evaluationId]);

  useEffect(() => {
    if (!evaluationId && currentEvaluation) {
      // load the first evaluation on load by default
      setActiveEvaluationId(currentEvaluation.id);
    }
  }, [!!currentEvaluation]);

  const isCurrent = currentEvaluation?.id === evaluation?.id;

  return (
    <>
      <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
        <StepSelect options={proposal?.evaluations || []} value={activeEvaluationId} onChange={setActiveEvaluationId} />
        <div>
          <IconButton onClick={goToEditProposal} size='small'>
            <EditIcon color='secondary' fontSize='small' />
          </IconButton>
        </div>
      </Box>
      <Divider />
      {evaluation?.type === 'rubric' && (
        <RubricEvaluation {...{ pageId, proposal, isCurrent, evaluation, refreshProposal, goToEditProposal }} />
      )}
      {evaluation?.type === 'feedback' && (
        <FeedbackEvaluation {...{ proposal, isCurrent, evaluation, goToEditProposal }} />
      )}
      {evaluation?.type === 'pass_fail' && (
        <PassFailEvaluation {...{ proposal, isCurrent, evaluation, refreshProposal }} />
      )}
    </>
  );
}

function StepSelect({
  options,
  value,
  onChange
}: {
  options: PopulatedEvaluation[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <Select
      value={value || ''}
      onChange={(e) => {
        onChange(e.target.value);
      }}
    >
      {options.map((evaulation) => (
        <MenuItem key={evaulation.id} value={evaulation.id}>
          <Stack flexDirection='row' alignItems='center' gap={1}>
            {evaluationIcons[evaulation.type]()}
            <Typography variant='body2'>{evaulation.title}</Typography>
          </Stack>
        </MenuItem>
      ))}
    </Select>
  );
}
