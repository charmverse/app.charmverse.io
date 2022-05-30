import { Box, Tab, Tabs, Typography } from '@mui/material';
import Legend from 'components/settings/Legend';
import Button from 'components/common/Button';
import { useState } from 'react';
import KeyIcon from '@mui/icons-material/Key';
import BountyIcon from '@mui/icons-material/RequestPage';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ForumIcon from '@mui/icons-material/Forum';
import GnosisTasksList from './GnosisTasksList';
import TasksPageHeader from './TasksPageHeader';

type TaskType = 'multisig' | 'bounty' | 'proposal' | 'discussion'

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
  { icon: <ForumIcon />, type: 'discussion' }
] as const;

export default function TasksPage () {
  const [currentTab, setCurrentTab] = useState<TaskType>('multisig');

  return (
    <>
      <Box
        display='flex'
        justifyContent='space-between'
        mb={3}
        sx={{
          display: {
            xs: 'none',
            sm: 'inherit'
          }
        }}
      >
        <Typography variant='h1' fontWeight='bold'>Personal Nexus</Typography>
      </Box>
      <TasksPageHeader />
      <Legend>
        My tasks
      </Legend>
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
                color={currentTab === task.type ? 'textPrimary' : 'secondary'}
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
