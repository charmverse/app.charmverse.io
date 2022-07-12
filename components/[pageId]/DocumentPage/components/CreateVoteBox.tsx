import { useState } from 'react';
import { Card, Stack, Typography } from '@mui/material';
import Button from 'components/common/PrimaryButton';
import CreateVoteModal from 'components/votes/components/CreateVoteModal';
import { useVotes } from 'hooks/useVotes';

export default function CreateVoteBox () {

  const { createVote } = useVotes();

  const [isModalOpen, setIsModalOpen] = useState(false);

  function openVoteModal () {
    setIsModalOpen(true);
  }

  return (
    <>
      <Card variant='outlined' sx={{ my: 3, py: 3 }}>
        <Stack alignItems='center' spacing={2}>
          <Typography variant='body2'>Create a vote when your Proposal is ready</Typography>
          <Button onClick={openVoteModal}>
            Create Vote
          </Button>
        </Stack>
      </Card>
      <CreateVoteModal
        createVote={createVote}
        isProposal={true}
        open={isModalOpen}
        postCreateVote={() => {
          setIsModalOpen(false);
        }}
        onClose={() => {
          setIsModalOpen(false);
        }}
      />
    </>
  );
}
