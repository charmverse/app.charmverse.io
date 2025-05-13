import { FormGroup, Stack } from '@mui/material';
import { useEffect, useState } from 'react';

import { Button } from 'components/common/Button';

import type { SnapshotVotingProps, VoteChoiceFormProps } from '../SnapshotVotingForm';

import { DisplayChoiceScore } from './DisplayChoiceScore';
import { DraggableRankedItem } from './DraggableRankedItem';

export function RankedVoting({
  snapshotProposal,
  userVotes,
  setVoteChoice,
  voteChoice
}: SnapshotVotingProps & VoteChoiceFormProps) {
  const voteOptions = snapshotProposal?.choices ?? [];
  const voteScores = snapshotProposal?.scores ?? [];

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

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    setSelectedItems((items) => {
      const arr = [...items];
      [arr[dragIndex], arr[hoverIndex]] = [arr[hoverIndex], arr[dragIndex]];

      return arr;
    });
  };

  return (
    <Stack gap={2}>
      <Stack gap={0.5}>
        {selectedItems.map((selected, i) => (
          <DraggableRankedItem
            key={selected}
            selectedItem={selected}
            index={i}
            label={voteOptions[selected - 1]}
            removeItem={removeItem}
            moveItem={moveItem}
            snapshotProposal={snapshotProposal}
          />
        ))}
      </Stack>

      <Stack gap={0.5}>
        {unselectedItems.map((unselected) => (
          <Stack direction='row' key={unselected} alignItems='center' gap={1}>
            <Button variant='outlined' color='textPrimary' onClick={() => addItem(unselected)} sx={{ flex: 1 }}>
              {voteOptions[unselected - 1]}
            </Button>
            <Stack>
              <DisplayChoiceScore snapshotProposal={snapshotProposal} choice={voteOptions[unselected - 1]} />
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
