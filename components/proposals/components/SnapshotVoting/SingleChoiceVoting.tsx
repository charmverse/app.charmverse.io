import { Box, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import { useState } from 'react';

import type { SnapshotProposal } from 'lib/snapshot';
import { percent } from 'lib/utilities/numbers';

type Props = {
  snapshotProposal: SnapshotProposal;
};

export function SingleChoiceVoting({ snapshotProposal }: Props) {
  const [userVoteChoice, setUserVoteChoice] = useState(0);

  const voteOptions = snapshotProposal?.choices ?? [];
  const voteScores = snapshotProposal?.scores ?? [];

  return (
    <RadioGroup value={userVoteChoice} onChange={(e, value) => setUserVoteChoice(Number(value))}>
      {voteOptions.map((voteOption, index) => (
        <FormControlLabel
          key={voteOption}
          control={<Radio size='small' />}
          value={index + 1}
          label={
            <Box display='flex' justifyContent='space-between' flexGrow={1}>
              <span>{voteOption}</span>
              <Typography variant='subtitle1' color='secondary'>
                {!voteScores[index]
                  ? 'No votes yet'
                  : percent({
                      value: voteScores[index],
                      total: snapshotProposal.scores_total,
                      significantDigits: 2
                    })}
              </Typography>
            </Box>
          }
          disableTypography
        />
      ))}
    </RadioGroup>
  );
}
