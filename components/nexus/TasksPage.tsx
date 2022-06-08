
import { useState } from 'react';
import { Box, Button, Divider, Grid, Tab, Tabs, Typography } from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import BountyIcon from '@mui/icons-material/RequestPage';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ForumIcon from '@mui/icons-material/Forum';
import styled from '@emotion/styled';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import GnosisTasksList from './GnosisTasksList';
import MentionedTasksList from './MentionedTasksList';
import TasksPageHeader from './TasksPageHeader';
import NexusPageTitle from './components/NexusPageTitle';
import NotifyMeButton from './components/NotifyMeButton';
import SnoozeButton from './components/SnoozeButton';

type TaskType = 'multisig' | 'bounty' | 'proposal' | 'discussion' | 'mentioned'

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

const TASK_TYPES = [
  { icon: <KeyIcon />, type: 'multisig' },
  { icon: <BountyIcon />, type: 'bounty' },
  { icon: <HowToVoteIcon />, type: 'proposal' },
  { icon: <ForumIcon />, type: 'discussion' },
  { icon: <AlternateEmailIcon />, type: 'mentioned' }
] as const;

const StyledTypography = styled(Typography)`
  font-size: 24px;
  font-weight: bold;
`;

export default function TasksPage () {
  const [currentTab, setCurrentTab] = useState<TaskType>('multisig');

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
        {currentTab === 'multisig' ? (
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
        textColor='primary'
        indicatorColor='secondary'
        value={currentTab}
      >
        {TASK_TYPES.map(task => (
          <Tab
            component='div'
            key={task.type}
            disableRipple
            label={(
              <Button
                sx={{
                  textTransform: 'uppercase',
                  '& .MuiButton-startIcon': {
                    display: {
                      xs: 'none',
                      sm: 'inherit'
                    }
                  }
                }}
                startIcon={task.icon}
                variant='text'
                size='small'
                onClick={() => setCurrentTab(task.type)}
                color={currentTab === task.type ? 'primary' : 'secondary'}
              >
                {task.type}
              </Button>
            )}
            value={task.type}
          />
        ))}
      </Tabs>
      {currentTab === 'multisig' ? <GnosisTasksList /> : null}
    </>
  );
}
