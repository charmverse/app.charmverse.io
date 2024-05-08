import { ThumbUpOutlined as ApprovedIcon, ThumbDownOutlined as RejectedIcon } from '@mui/icons-material';
import { Box, Card, FormLabel, Stack, Typography } from '@mui/material';

import type { PopulatedEvaluation } from 'lib/proposals/interfaces';
import { getRelativeTimeInThePast } from 'lib/utils/dates';

export type Props = {
  proposalId?: string;
  isCurrent: boolean;
  archived?: boolean;
  evaluation: Pick<PopulatedEvaluation, 'id' | 'completedAt' | 'reviewers' | 'result' | 'isReviewer' | 'actionLabels'>;
};

export function PrivateEvaluation({ proposalId, isCurrent, archived, evaluation }: Props) {
  const completedDate = evaluation.completedAt ? getRelativeTimeInThePast(new Date(evaluation.completedAt)) : null;

  return (
    <Card variant='outlined'>
      {!evaluation.result && (
        <Box display='flex' justifyContent='space-between' alignItems='center' p={2}>
          <FormLabel>
            <Typography component='span' variant='subtitle1'>
              {isCurrent ? 'This proposal is being evaluated' : 'This proposal will be evaluated'}
            </Typography>
          </FormLabel>
        </Box>
      )}
      {evaluation.result === 'pass' && (
        <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' p={2}>
          <ApprovedIcon color='success' />
          <Typography variant='body2'>Approved {completedDate}</Typography>
        </Stack>
      )}
      {evaluation.result === 'fail' && (
        <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' p={2}>
          <RejectedIcon color='error' />
          <Typography variant='body2'>Declined {completedDate}</Typography>
        </Stack>
      )}
    </Card>
  );
}
