import { Page } from '@prisma/client';
import { useState } from 'react';
import { Box, Card, Stack, Typography } from '@mui/material';
import { ExtendedVote } from 'lib/votes/interfaces';
import Button from 'components/common/PrimaryButton';
import CreateVoteModal from 'components/votes/components/CreateVoteModal';
import PageInlineVote from 'components/common/CharmEditor/components/inlineVote/components/PageInlineVote';
import { useVotes } from 'hooks/useVotes';

export default function ProposalVote ({ page, vote }: { page: Page, vote?: ExtendedVote }) {
  const { createVote } = useVotes();

  const [isModalOpen, setIsModalOpen] = useState(false);

  function openVoteModal () {
    setIsModalOpen(true);
  }

  // async function castVote (voteId: string, choice: string) {
  //   const userVote = await charmClient.castVote(voteId, choice);
  //   refreshVotes();
  //   return userVote;
  // }

  // async function cancelVote (voteId: string) {
  //   await charmClient.cancelVote(voteId);
  //   refreshVotes();
  // }

  // async function deleteVote (voteId: string) {
  //   await charmClient.deleteVote(voteId);
  //   refreshVotes();
  // }

  // async function createVote (votePayload: Omit<VoteDTO, 'createdBy' | 'spaceId' | 'pageId'>) {

  //   if (!user || !currentSpace) {
  //     throw new Error('Missing user or space');
  //   }

  //   const extendedVote = await charmClient.createVote({
  //     ...votePayload,
  //     createdBy: user.id,
  //     pageId: page.id,
  //     spaceId: currentSpace.id
  //   });

  //   refreshVotes((_votes) => [...(_votes || []), extendedVote], { revalidate: true });

  //   mutateTasks((tasks) => {
  //     // Add the vote to the task
  //     if (tasks && currentSpace) {
  //       tasks.votes.push({
  //         ...extendedVote,
  //         space: currentSpace,
  //         page
  //       });
  //     }
  //     return tasks;
  //   }, {
  //     revalidate: false
  //   });
  //   return extendedVote;
  // }

  if (!vote) {
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
  return (
    <Box mt={2}>
      <PageInlineVote inlineVote={vote} detailed={false} isProposal={true} />
    </Box>
  );
}
