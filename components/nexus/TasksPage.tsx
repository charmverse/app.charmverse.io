
import Legend from 'components/settings/Legend';
import { useState } from 'react';
import KeyIcon from '@mui/icons-material/Key';
import BountyIcon from '@mui/icons-material/RequestPage';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ForumIcon from '@mui/icons-material/Forum';
import GnosisTasksList from './GnosisTasksList';
import TasksPageHeader from './TasksPageHeader';
import NexusPageTitle from './components/NexusPageTitle';
import SnoozeButton from './components/SnoozeButton';

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
      <NexusPageTitle />
      <TasksPageHeader />
      <Legend sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>My tasks</span>
        <SnoozeButton />
      </Legend>
      {/* <Tabs
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
      </Tabs> */}
      {currentTab === 'multisig' ? <GnosisTasksList /> : null}
    </>
  );
}
