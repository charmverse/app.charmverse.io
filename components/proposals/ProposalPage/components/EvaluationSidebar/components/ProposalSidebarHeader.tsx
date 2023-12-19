import type { ProposalEvaluationType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { Box, Divider, IconButton, MenuItem, Select, Stack, Tooltip, Typography } from '@mui/material';
import { useMemo } from 'react';

import { SIDEBAR_VIEWS } from 'components/[pageId]/DocumentPage/components/Sidebar/constants';
import { evaluationIcons } from 'components/settings/proposals/constants';
import type { PopulatedEvaluation } from 'lib/proposal/interface';

export const evaluationTypesWithSidebar: ProposalEvaluationType[] = ['pass_fail', 'rubric', 'vote'];

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
  goToEvaluation: (evaluationId?: string) => void;
  goToSettings: VoidFunction;
}) {
  const selectableEvaluations = useMemo(() => {
    return evaluations.filter((evaluation) => evaluationTypesWithSidebar.includes(evaluation.type));
  }, [evaluations]);

  function toggleSettings() {
    if (activeEvaluationId) {
      goToSettings();
    } else {
      goToEvaluation();
    }
  }
  if (selectableEvaluations.length === 0) {
    return null;
  }
  return (
    <>
      <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
        <StepSelect
          options={selectableEvaluations}
          value={activeEvaluationId || ''}
          onChange={goToEvaluation}
          goToSettings={goToSettings}
        />
        <Tooltip title={SIDEBAR_VIEWS.proposal_evaluation_settings.tooltip}>
          <div>
            <IconButton onClick={toggleSettings} size='small'>
              <SettingsIcon color={activeEvaluationId ? 'secondary' : 'inherit'} fontSize='small' />
            </IconButton>
          </div>
        </Tooltip>
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
      renderValue={(evaluationId) => {
        const evaluation = options.find((option) => option.id === evaluationId);
        if (evaluationId === '' || !evaluation) {
          return (
            <Typography variant='body2' color='secondary'>
              Select step
            </Typography>
          );
        }
        return (
          <Stack flexDirection='row' alignItems='center' gap={1}>
            {evaluationIcons[evaluation.type]?.({ color: 'inherit' })}
            <Typography variant='body2'>{evaluation.title}</Typography>
          </Stack>
        );
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
    </StyledSelect>
  );
}
