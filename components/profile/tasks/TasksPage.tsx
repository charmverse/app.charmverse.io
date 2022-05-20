import { Box, Typography } from '@mui/material';
import GnosisTasksList from './GnosisTasksList';
import IntegrationCard from './IntegrationCard';

export default function TasksPage () {

  return (
    <>
      <Box display='flex' justifyContent='space-between' mb={3}>
        <Typography variant='h1'>My Tasks</Typography>
      </Box>

      {/* <GnosisTasksList /> */}
      <IntegrationCard />
    </>
  );
}
