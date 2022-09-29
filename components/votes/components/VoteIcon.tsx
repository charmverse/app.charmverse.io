import MuiVoteIcon from '@mui/icons-material/HowToVoteOutlined';
import TaskIcon from '@mui/icons-material/TaskOutlined';
import Box from '@mui/material/Box';
import type { Vote } from '@prisma/client';

type Props = Pick<Vote, 'context'>

export default function VoteIcon ({ context }: Props) {

  return (
    <Box component='span' sx={{ display: { xs: 'none', md: 'inline' } }}>
      {
        context === 'proposal' ? <TaskIcon color='secondary' /> : <MuiVoteIcon color='secondary' />
      }
    </Box>
  );

}
