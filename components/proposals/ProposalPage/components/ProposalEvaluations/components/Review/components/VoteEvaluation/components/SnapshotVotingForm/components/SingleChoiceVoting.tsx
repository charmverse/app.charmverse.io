import { Box, Chip, FormControlLabel, Radio, RadioGroup, Stack, Typography } from '@mui/material';
import { useEffect } from 'react';

import type { SnapshotVotingProps, VoteChoiceFormProps } from '../SnapshotVotingForm';

import { DisplayChoiceScore } from './DisplayChoiceScore';

export function SingleChoiceVoting({
  snapshotProposal,
  userVotes,
  setVoteChoice,
  voteChoice
}: SnapshotVotingProps & VoteChoiceFormProps) {
  useEffect(() => {
    if (userVotes?.[0]?.choice) {
      setVoteChoice(userVotes?.[0]?.choice);
    }
  }, [userVotes?.[0]?.choice]);

  const voteOptions = snapshotProposal?.choices ?? [];

  return (
    <RadioGroup value={voteChoice} onChange={(e, value) => setVoteChoice(Number(value))}>
      {voteOptions.map((voteOption, index) => (
        <FormControlLabel
          key={voteOption}
          control={<Radio size='small' />}
          value={index + 1}
          label={
            <Box display='flex' justifyContent='space-between' flexGrow={1}>
              <Stack direction='row' spacing={1}>
                <Typography>{voteOption}</Typography>
                {userVotes?.find((v) => v.choice === index + 1) && <Chip color='teal' size='small' label='Voted' />}
              </Stack>

              <DisplayChoiceScore snapshotProposal={snapshotProposal} choice={voteOption} />
            </Box>
          }
          sx={{ mr: 0 }}
          disableTypography
        />
      ))}
    </RadioGroup>
  );
}
