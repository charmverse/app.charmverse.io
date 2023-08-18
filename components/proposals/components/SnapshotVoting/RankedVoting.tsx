import { Close } from '@mui/icons-material';
import { FormGroup, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { Button } from 'components/common/Button';
import type {
  SnapshotVotingProps,
  VoteChoiceFormProps
} from 'components/proposals/components/SnapshotVoting/SnapshotVotingForm';

export function RankedVoting({
  snapshotProposal,
  userVotes,
  setVoteChoice,
  voteChoice
}: SnapshotVotingProps & VoteChoiceFormProps) {
  const voteOptions = snapshotProposal?.choices ?? [];
  const voteScores = snapshotProposal?.scores ?? [];
  const voteChoiceArray = Array.isArray(voteChoice) ? voteChoice : null;

  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [unselectedItems, setUnselectedItems] = useState<number[]>([]);

  useEffect(() => {
    const choice = userVotes?.[0]?.choice;

    if (Array.isArray(choice)) {
      setVoteChoice(choice);
    }
  }, [userVotes]);

  useEffect(() => {
    if (selectedItems.length === 0) {
      setUnselectedItems(voteOptions.map((_, index) => index + 1));
    }
    // set user choice only when all of the options are selected
    setVoteChoice(selectedItems.length === voteOptions.length ? selectedItems : null);
  }, [selectedItems]);

  const updateUnselectedItems = (selected: number[]) => {
    const updatedUnselectedItems = voteOptions.map((_, index) => index + 1).filter((i) => !selected.includes(i));
    setUnselectedItems(updatedUnselectedItems);
  };

  const removeItem = (item: number) => {
    setSelectedItems((v) => {
      const updatedSelectedItems = v.filter((i) => i !== item);
      updateUnselectedItems(updatedSelectedItems);

      return updatedSelectedItems;
    });
  };
  const addItem = (item: number) =>
    setSelectedItems((v) => {
      const updatedSelectedItems = [...v, item];
      updateUnselectedItems(updatedSelectedItems);

      return updatedSelectedItems;
    });

  return (
    <FormGroup sx={{ gap: 3 }}>
      <Stack gap={0.5}>
        {selectedItems.map((selected, i) => (
          <Button key={selected} variant='outlined' color='textPrimary'>
            <Stack direction='row' justifyContent='space-between' alignItems='center' flex={1} px={1}>
              <Typography sx={{ width: '25px' }}>{i + 1}.</Typography>
              <Typography>{voteOptions[selected - 1]}</Typography>
              <Stack
                sx={{ width: '25px', cursor: 'pointer' }}
                onClick={(e) => {
                  e.preventDefault();
                  removeItem(selected);
                }}
              >
                <Close color='secondary' fontSize='small' />
              </Stack>
            </Stack>
          </Button>
        ))}
      </Stack>

      <Stack gap={0.5}>
        {unselectedItems.map((unselected) => (
          <Button key={unselected} variant='outlined' color='textPrimary' onClick={() => addItem(unselected)}>
            {voteOptions[unselected - 1]}
          </Button>
        ))}
      </Stack>
    </FormGroup>
  );
}
