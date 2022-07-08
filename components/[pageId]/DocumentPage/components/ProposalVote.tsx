import { Page } from '@prisma/client';
import { Box, Typography } from '@mui/material';
import Button from 'components/common/PrimaryButton';
import { useVotes } from 'hooks/useVotes';

export default function ProposalVote ({ page }: { page: Page }) {
  const { votes } = useVotes();
  const pageVote = Object.values(votes).find(vote => vote.pageId === page.id);
  if (!pageVote) {
    return (
      <Box display='flex' my={3} justifyContent='center'>
        <Typography variant='body2'>Create a vote when the Proposal is ready</Typography>
        <Button>
          Create a Vote
        </Button>
      </Box>
    );
  }
  return (
    <div>
      <h1>ProposalVote</h1>
    </div>
  );
}
