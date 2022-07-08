import { Page } from '@prisma/client';
import { useVotes } from 'hooks/useVotes';

export default function ProposalVote ({ page }: { page: Page }) {
  const { votes } = useVotes();
  const pageVote = Object.values(votes).find(vote => vote.pageId === page.id);
  if (!pageVote) {
    return null;
  }
  return (
    <div>
      <h1>ProposalVote</h1>
    </div>
  );
}
