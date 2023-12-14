import type { ProposalEvaluationType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { Box, Divider, IconButton, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';

import { evaluationIcons } from 'components/settings/proposals/constants';
import type { PopulatedEvaluation } from 'lib/proposal/interface';

export const evaluationTypesWithSidebar: ProposalEvaluationType[] = ['rubric', 'vote'];

const StyledSelect = styled(Select)`
  .MuiOutlinedInput-notchedOutline {
    border: 0 none !important;
  }
`;

type EvaluationOption = Pick<PopulatedEvaluation, 'id' | 'title' | 'type'>;

export function ProposalSidebarHeader({
  activeEvaluationId,
  evaluations,
  goToEvaluation,
  goToSettings
}: {
  activeEvaluationId?: string | null;
  evaluations: EvaluationOption[];
  goToEvaluation: (evalId: string) => void;
  goToSettings: VoidFunction;
}) {
  const selectableEvaluations = useMemo(() => {
    return evaluations.filter((evaluation) => evaluationTypesWithSidebar.includes(evaluation.type));
  }, [evaluations]);
  return (
    <>
      <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
        <StepSelect
          options={selectableEvaluations}
          value={activeEvaluationId || ''}
          onChange={goToEvaluation}
          goToSettings={goToSettings}
        />
        <div>
          {activeEvaluationId && (
            <IconButton onClick={goToSettings} size='small'>
              <SettingsIcon color='secondary' fontSize='small' />
            </IconButton>
          )}
        </div>
      </Box>
      <Divider />
    </>
  );
}

function StepSelect({
  options,
  value,
  onChange,
  goToSettings
}: {
  options: EvaluationOption[];
  value: string | null;
  onChange: (value: string) => void;
  goToSettings: VoidFunction;
}) {
  return (
    <StyledSelect
      displayEmpty
      value={value || ''}
      onChange={(e) => {
        if (e.target.value === '') {
          goToSettings();
        } else {
          onChange(e.target.value as string);
        }
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
      <Divider />
      <MenuItem value=''>
        <Stack flexDirection='row' alignItems='center' gap={1}>
          <SettingsIcon fontSize='small' color='secondary' />
          <Typography variant='body2'>Settings</Typography>
        </Stack>
      </MenuItem>
    </StyledSelect>
  );
}
