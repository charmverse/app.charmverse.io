import { ThumbUpOutlined as ApprovedIcon, ThumbDownOutlined as RejectedIcon } from '@mui/icons-material';
import { Box, Card, FormLabel, Stack, Typography } from '@mui/material';

import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { PopulatedEvaluation } from '@packages/lib/proposals/interfaces';
import { getRelativeTimeInThePast } from '@packages/lib/utils/dates';

export type Props = {
  isCurrent?: boolean;
  evaluation: Partial<Pick<PopulatedEvaluation, 'completedAt' | 'result'>>;
};

export function PrivateEvaluation({ isCurrent, evaluation }: Props) {
  const completedDate = evaluation.completedAt ? getRelativeTimeInThePast(new Date(evaluation.completedAt)) : null;

  const { getFeatureTitle } = useSpaceFeatures();

  const proposalLabel = getFeatureTitle('proposal');

  return (
    <Card variant='outlined'>
      {!evaluation.result && (
        <Box display='flex' justifyContent='space-between' alignItems='center' p={2}>
          <FormLabel>
            <Typography component='span' variant='subtitle1'>
              {isCurrent
                ? `This ${proposalLabel} is being evaluated`
                : `This ${proposalLabel} will be evaluated by reviewers`}
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
