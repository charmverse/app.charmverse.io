import { Stack, Typography } from '@mui/material';

import type { SnapshotProposal } from '@packages/lib/snapshot/interfaces';
import { percent } from '@packages/lib/utils/numbers';

type Props = {
  snapshotProposal?: SnapshotProposal;
  choice: string;
};

export function DisplayChoiceScore({ snapshotProposal, choice }: Props) {
  const voteOptions = snapshotProposal?.choices ?? [];
  const voteScores = snapshotProposal?.scores ?? [];
  const index = voteOptions.findIndex((v) => v === choice);

  if (!snapshotProposal || index < 0) {
    return null;
  }

  return (
    <Stack direction='row' alignItems='center' justifyContent='flex-end' width='85px'>
      <Typography variant='subtitle1' color='secondary'>
        {!voteScores[index]
          ? 'No votes yet'
          : percent({
              value: voteScores[index],
              total: snapshotProposal.scores_total,
              significantDigits: 2
            })}
      </Typography>
    </Stack>
  );
}
