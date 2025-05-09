import { Box, Checkbox, Chip, FormControlLabel, FormGroup, Stack, Typography } from '@mui/material';
import { useEffect } from 'react';

import type { SnapshotVotingProps, VoteChoiceFormProps } from '../SnapshotVotingForm';

import { DisplayChoiceScore } from './DisplayChoiceScore';

export function MultiChoiceVoting({
  snapshotProposal,
  userVotes,
  setVoteChoice,
  voteChoice
}: SnapshotVotingProps & VoteChoiceFormProps) {
  useEffect(() => {
    if (userVotes?.length && Array.isArray(userVotes[0].choice)) {
      setVoteChoice(userVotes[0].choice);
    } else {
      setVoteChoice([]);
    }
  }, [userVotes]);

  const voteOptions = snapshotProposal?.choices ?? [];

  const isChecked = (index: number) => {
    if (Array.isArray(voteChoice)) {
      return voteChoice.includes(index + 1);
    }

    return false;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (Array.isArray(voteChoice)) {
      const newVoteChoice = [...voteChoice];
      const index = newVoteChoice.indexOf(Number(event.target.name));
      if (index > -1) {
        newVoteChoice.splice(index, 1);
      } else {
        newVoteChoice.push(Number(event.target.name));
      }

      setVoteChoice(newVoteChoice);
    }
  };

  return (
    <FormGroup>
      {voteOptions.map((voteOption, index) => (
        <FormControlLabel
          key={voteOption}
          control={<Checkbox checked={isChecked(index)} onChange={handleChange} name={`${index + 1}`} />}
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
    </FormGroup>
  );
}
