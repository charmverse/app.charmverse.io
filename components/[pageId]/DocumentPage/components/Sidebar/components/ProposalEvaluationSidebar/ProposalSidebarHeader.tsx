import { Edit as EditIcon } from '@mui/icons-material';
import { Box, Divider, IconButton, MenuItem, Select, Stack, Typography } from '@mui/material';

import { evaluationIcons } from 'components/settings/proposals/constants';
import type { PopulatedEvaluation } from 'lib/proposal/interface';

export function ProposalSidebarHeader({
  activeEvaluationId = null,
  evaluations,
  goToEvaluation,
  goToSettings
}: {
  activeEvaluationId: string | null;
  evaluations: PopulatedEvaluation[];
  goToEvaluation: (evalId: string | null) => void;
  goToSettings: VoidFunction;
}) {
  return (
    <>
      <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
        <StepSelect options={evaluations} value={activeEvaluationId} onChange={goToEvaluation} />
        <div>
          <IconButton onClick={goToSettings} size='small'>
            <EditIcon color='secondary' fontSize='small' />
          </IconButton>
        </div>
      </Box>
      <Divider />
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
