import type { ProposalEvaluation } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import { Box, ButtonGroup, Stack } from '@mui/material';

import { Button } from 'components/common/Button';
import { evaluationIcons } from 'components/settings/proposals/constants';
import { getCurrentEvaluation } from 'lib/proposal/workflows/getCurrentEvaluation';

const StyledButton = styled(Button, { shouldForwardProp: (prop) => prop !== 'isDraft' })<{ isDraft?: boolean }>(
  ({ isDraft }) => `
  ${
    isDraft
      ? `
    cursor: default;
    &:hover {
      background-color: transparent;
    }
    border-color: rgba(136, 136, 136, 0.5) !important; /* override the hover effect. TODO: find where this is defined */
  }`
      : ''
  }
`
);

type Props = {
  evaluations: Pick<ProposalEvaluation, 'id' | 'index' | 'result' | 'title' | 'type'>[];
  isDraft?: boolean;
};

export function ProposalEvaluationsStatus({ evaluations, isDraft }: Props) {
  const currentEvaluation = !isDraft && getCurrentEvaluation(evaluations);

  return (
    <Stack flexDirection='row' justifyContent='space-between'>
      <ButtonGroup>
        {evaluations.map((evaluation) => {
          const color =
            currentEvaluation === evaluation
              ? 'primary'
              : evaluation.result === 'pass'
              ? 'success'
              : evaluation.result === 'fail'
              ? 'error'
              : 'secondary';
          return (
            <StyledButton
              size='small'
              isDraft={isDraft}
              key={evaluation.id}
              variant={evaluation === currentEvaluation ? 'contained' : 'outlined'}
              color={color}
              startIcon={evaluationIcons[evaluation.type]({
                color: 'inherit'
              })}
            >
              {evaluation.title}
            </StyledButton>
          );
        })}
      </ButtonGroup>
    </Stack>
  );
}
