import Box from '@mui/material/Box';
import TaskIcon from '@mui/icons-material/TaskOutlined';
import MuiVoteIcon from '@mui/icons-material/HowToVoteOutlined';
import { Vote, VoteStatus } from '@prisma/client';

type Props = Pick<Vote, 'context'> & {status: 'Draft' | VoteStatus}

export default function VoteIcon ({ context, status }: Props) {

  const proposalIconColor = status === 'InProgress' ? 'primary' : 'secondary';

  return (
    <Box component='span' sx={{ display: { xs: 'none', md: 'inline' } }}>
      {
        context === 'proposal' ? <TaskIcon color={proposalIconColor} /> : <MuiVoteIcon color='secondary' />
      }
    </Box>
  );

}
