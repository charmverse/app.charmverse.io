import { Add, Remove } from '@mui/icons-material';
import { Box, Chip, FormControlLabel, FormGroup, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo } from 'react';

import { Button } from 'components/common/Button';
import { getNumberFromString } from 'components/common/form/getNumberFromString';
import { DisplayChoiceScore } from 'components/proposals/components/SnapshotVoting/DisplayChoiceScore';
import type {
  SnapshotVotingProps,
  VoteChoiceFormProps
} from 'components/proposals/components/SnapshotVoting/SnapshotVotingForm';
import { percent } from 'lib/utilities/numbers';

const isValidChoiceRecord = (choice: any): choice is Record<string, number> => {
  return typeof choice === 'object' && !Array.isArray(choice) && choice !== null;
};

export function WeightedVoting({
  snapshotProposal,
  userVotes,
  setVoteChoice,
  voteChoice
}: SnapshotVotingProps & VoteChoiceFormProps) {
  const voteChoiceRecord = isValidChoiceRecord(voteChoice) ? voteChoice : null;

  useEffect(() => {
    const choice = userVotes?.[0]?.choice;

    if (isValidChoiceRecord(choice)) {
      setVoteChoice(choice);
    } else {
      setVoteChoice({});
    }
  }, [userVotes]);

  const voteOptions = snapshotProposal?.choices ?? [];
  const voteScores = snapshotProposal?.scores ?? [];

  const totalScore = useMemo(() => {
    if (voteChoiceRecord) {
      return Object.values(voteChoiceRecord).reduce((acc, curr) => acc + curr, 0);
    }

    return 0;
  }, [voteChoiceRecord]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVoteChoice = { ...voteChoiceRecord };

    newVoteChoice[event.target.name] = getNumberFromString(event.target.value || '0') || 0;

    setVoteChoice(newVoteChoice);
  };

  const decreaseVote = (index: number) => {
    const newVoteChoice = { ...voteChoiceRecord };
    newVoteChoice[index + 1] = Math.max(0, (newVoteChoice[index + 1] || 0) - 1);

    setVoteChoice(newVoteChoice);
  };

  const increaseVote = (index: number) => {
    const newVoteChoice = { ...voteChoiceRecord };
    newVoteChoice[index + 1] = (newVoteChoice[index + 1] || 0) + 1;

    setVoteChoice(newVoteChoice);
  };

  return (
    <FormGroup sx={{ gap: 0.5 }}>
      {voteOptions.map((voteOption, index) => (
        <FormControlLabel
          key={voteOption}
          control={
            <Stack direction='row' gap={0.5} mr={1}>
              <Button
                sx={{ minWidth: '40px', px: 1 }}
                onClick={() => decreaseVote(index)}
                variant='outlined'
                color='textPrimary'
              >
                <Remove color='inherit' fontSize='small' />
              </Button>
              <TextField
                value={voteChoiceRecord?.[index + 1] || 0}
                onChange={handleChange}
                name={`${index + 1}`}
                sx={{ maxWidth: '70px' }}
              />

              <Button
                sx={{ minWidth: '40px', px: 1 }}
                variant='outlined'
                color='textPrimary'
                onClick={() => increaseVote(index)}
              >
                <Add color='inherit' fontSize='small' />
              </Button>

              <Stack justifyContent='center' alignContent='center' minWidth='45px'>
                <DisplayChoiceScore snapshotProposal={snapshotProposal} choice={voteOption} />
              </Stack>
            </Stack>
          }
          sx={{ mr: 0, ml: 0 }}
          label={
            <Box display='flex' justifyContent='space-between' flexGrow={1}>
              <Stack direction='row' spacing={1}>
                <Typography>{voteOption}</Typography>
                {userVotes?.find((v) => v.choice === index + 1) && <Chip color='teal' size='small' label='Voted' />}
              </Stack>
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
    </FormGroup>
  );
}
