import styled from '@emotion/styled';
import { List, Typography } from '@mui/material';
import { Box } from '@mui/system';
import PageInlineVote from 'components/common/CharmEditor/components/PageInlineVote';
import { useInlineVotes } from 'hooks/useInlineVotes';
import PageThreadsList from './PageThreadsList';

export const StyledPageInlineVotesList = styled(List)`
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: 0px;
  padding-bottom: 0px;
  height: calc(100% - 50px);
`;

export default function PageInlineVotesList () {
  const { inlineVotes } = useInlineVotes();

  return (
    <Box>
      <Typography fontWeight={600} fontSize={20}>
        Votes
      </Typography>
      <StyledPageInlineVotesList>
        {Object.values(inlineVotes).map(inlineVote => <PageInlineVote inlineVote={inlineVote} key={inlineVote.id} />)}
      </StyledPageInlineVotesList>
    </Box>
  );
}
