import { Box, Typography } from '@mui/material';
import Button from 'components/common/Button';
import TasksList from './TasksList';

export default function TasksPage () {

  return (
    <>
      <Box display='flex' justifyContent='space-between' mb={3}>
        <Typography variant='h1'>My Tasks</Typography>
      </Box>
      <TasksList />
    </>
  );
}
