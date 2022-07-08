import { Page } from '@prisma/client';
import { Card, Stack, Typography } from '@mui/material';
import Button from 'components/common/PrimaryButton';
import { useVotes } from 'hooks/useVotes';

export default function ProposalVote ({ page }: { page: Page }) {
  const { votes } = useVotes();
  const pageVote = Object.values(votes).find(vote => vote.pageId === page.id);
  if (!pageVote) {
    return (
      <Card variant='outlined' sx={{ my: 3, py: 3 }}>
        <Stack alignItems='center' spacing={2}>
          <Typography variant='body2'>Create a vote when your Proposal is ready</Typography>
          <Button>
            Create Vote
          </Button>
        </Stack>
      </Card>
    );
  }
  return (
    <div>
      <h1>ProposalVote</h1>
    </div>
  );
}
