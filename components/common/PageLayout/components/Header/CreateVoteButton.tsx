import Button from 'components/common/Button';
import { useState } from 'react';
import CreateVoteModal from '../CreateVoteModal';

export function CreateVoteButton () {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setIsModalOpen(true);
        }}
        variant='outlined'
        color='secondary'
        size='small'
        sx={{
          mx: 1
        }}
      >
        Create Vote
      </Button>
      <CreateVoteModal
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
