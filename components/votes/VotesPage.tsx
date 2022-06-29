import { Box, Stack, Typography } from '@mui/material';
import VoteIcon from '@mui/icons-material/HowToVoteOutlined';
import { Vote } from '@prisma/client';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import Database from 'components/common/Database';
import { Column, Row, View } from 'components/common/Database/interfaces';

const votes: Vote[] = [{
  createdAt: new Date(),
  initiatorId: 'cc',
  id: 'aa',
  title: 'PUt it to a vote!',
  description: '',
  pageId: '',
  deadline: new Date(),
  options: [],
  status: 'Cancelled'
}];

export default function VotesPage () {

  const fields: Column[] = [{
    id: 'title',
    label: 'Title'
  }];

  const rows: Row[] = votes.map((vote) => ({
    id: vote.id,
    title: vote.title,
    fields: {}
  }));

  const views: View[] = [{
    id: 'aa',
    title: 'Table view',
    type: 'board'
  }];

  return (
    <ScrollableWindow>
      <Box py={3} sx={{ px: { xs: '40px', sm: '80px' }, minHeight: '80vh' }}>
        <Stack direction='row' alignItems='center' gap={1} mb={1}>
          <VoteIcon fontSize='large' />
          <Typography variant='h1'> Votes</Typography>
        </Stack>
        <Database fields={fields} rows={rows} views={views} />
      </Box>
    </ScrollableWindow>
  );
}
