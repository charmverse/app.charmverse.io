
import { Box, Divider, Grid, Tab, Tabs, Typography } from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import ForumIcon from '@mui/icons-material/Forum';
import styled from '@emotion/styled';
import { useRouter } from 'next/router';
import Link from 'next/link';
import GnosisTasksList from './GnosisTasksList';
import MentionedTasksList from './MentionedTasksList';
import TasksPageHeader from './TasksPageHeader';
import NexusPageTitle from './components/NexusPageTitle';
import NotifyMeButton from './components/NotifyMeButton';
import SnoozeButton from './components/SnoozeButton';
import useTasks from './hooks/useTasks';

const tabStyles = {
  mb: 2,
  minHeight: {
    xs: '34px',
    sm: '48px'
  },
  '.MuiTab-root': {
    p: {
      xs: 0,
      sm: 1
    },
    minWidth: {
      xs: 'fit-content',
      sm: '90px'
    },
    flexGrow: {
      xs: 1,
      sm: 'revert'
    }
  }
};

const TASK_TABS = [
  { icon: <KeyIcon />, label: 'Multisig', type: 'multisig' },
  // { icon: <BountyIcon />, label: 'Bounty', type: 'bounty' },
  // { icon: <HowToVoteIcon />, label: 'Proposal', type: 'proposal' },
  { icon: <ForumIcon />, label: 'Discussion', type: 'discussion' }
] as const;

const StyledTypography = styled(Typography)`
  font-size: 24px;
  font-weight: bold;
`;

export default function TasksPage () {
  const router = useRouter();
  const { task: taskType = 'multisig' } = router.query;
  const { error, mutate: mutateTasks, tasks } = useTasks();

  return (
    <>
      <NexusPageTitle />
      <TasksPageHeader />
      <Grid container spacing={3} sx={{ pt: 6, pb: 2 }}>
        <Grid item xs={12} sm={6}>
          <Box>
            <StyledTypography>
              My tasks
            </StyledTypography>
          </Box>
        </Grid>
        {taskType === 'multisig' ? (
          <Grid item xs={12} sm={6}>
            <Box display='flex' alignItems='center' justifyContent={{ xs: 'flex-start', md: 'flex-end' }} gap={{ sm: 2, xs: 1 }}>
              <NotifyMeButton />
              <SnoozeButton />
            </Box>
          </Grid>
        ) : null}
      </Grid>
      <Divider sx={{ mb: 2 }} />
      <Tabs
        sx={tabStyles}
        indicatorColor='primary'
        value={TASK_TABS.findIndex(taskTab => taskTab.type === taskType)}
      >
        {TASK_TABS.map(task => (
          <Link href={`/nexus/?task=${task.type}`} passHref key={task.label}>
            <Tab
              component='div'
              disableRipple
              iconPosition='start'
              icon={task.icon}
              sx={{ px: 1.5, fontSize: 14, minHeight: 0 }}
              label={task.label}
            />
          </Link>
        ))}
      </Tabs>
      {taskType === 'multisig' ? <GnosisTasksList error={error} mutateTasks={mutateTasks} tasks={tasks} /> : taskType === 'discussion' ? <MentionedTasksList error={error} tasks={tasks} /> : null}
    </>
  );
}
