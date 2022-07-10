import { Page } from '@prisma/client';
import { useState } from 'react';
import { Box, Card, Stack, Typography } from '@mui/material';
import Button from 'components/common/PrimaryButton';
import { VoteDTO } from 'lib/votes/interfaces';
import LoadingComponent from 'components/common/LoadingComponent';
import CreateVoteModal from 'components/votes/components/CreateVoteModal';
import PageInlineVote from 'components/common/CharmEditor/components/inlineVote/components/PageInlineVote';
import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useTasks from 'components/nexus/hooks/useTasks';
import useSWR from 'swr';

export default function ProposalVote ({ page }: { page: Page }) {
  const [user] = useUser();
  const [currentSpace] = useCurrentSpace();
  const { mutate: mutateTasks } = useTasks();
  const { data: votes, mutate: refreshVotes } = useSWR(() => `pages/${page.id}/votes`, () => charmClient.getVotesByPage(page.id));

  const vote = votes?.[0];

  const [isModalOpen, setIsModalOpen] = useState(false);

  function openVoteModal () {
    setIsModalOpen(true);
  }

  async function castVote (voteId: string, choice: string) {
    const userVote = await charmClient.castVote(voteId, choice);
    refreshVotes();
    return userVote;
  }

  async function cancelVote (voteId: string) {
    await charmClient.cancelVote(voteId);
    refreshVotes();
  }

  async function deleteVote (voteId: string) {
    await charmClient.deleteVote(voteId);
    refreshVotes();
  }

  async function createVote (votePayload: Omit<VoteDTO, 'createdBy' | 'spaceId' | 'pageId'>) {

    if (!user || !currentSpace) {
      throw new Error('Missing user or space');
    }

    const extendedVote = await charmClient.createVote({
      ...votePayload,
      createdBy: user.id,
      pageId: page.id,
      spaceId: currentSpace.id
    });

    refreshVotes((_votes) => [...(_votes || []), extendedVote], { revalidate: true });

    mutateTasks((tasks) => {
      // Add the vote to the task
      if (tasks && currentSpace) {
        tasks.votes.push({
          ...extendedVote,
          space: currentSpace,
          page
        });
      }
      return tasks;
    }, {
      revalidate: false
    });
    return extendedVote;
  }

  if (!votes) {
    return <LoadingComponent height='300px' isLoading={true} />;
  }

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
      <PageInlineVote inlineVote={vote} detailed={false} isProposal={true} cancelVote={cancelVote} deleteVote={deleteVote} castVote={castVote} />
    </Box>
  );
}
