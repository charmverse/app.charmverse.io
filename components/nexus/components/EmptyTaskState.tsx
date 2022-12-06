import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Box, Card, Typography } from '@mui/material';

export function EmptyTaskState({ taskType }: { taskType: string }) {
  return (
    <Card variant='outlined'>
      <Box p={3} textAlign='center'>
        <TaskOutlinedIcon />
        <Typography color='secondary'>You don't have any {taskType} to review right now</Typography>
      </Box>
    </Card>
  );
}
