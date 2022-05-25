import { Box, Tab, Typography } from '@mui/material';
import Legend from 'components/settings/Legend';
import Button from 'components/common/Button';
import Tabs from '@mui/material/Tabs';
import { useState } from 'react';
import KeyIcon from '@mui/icons-material/Key';
import BountyIcon from '@mui/icons-material/RequestPage';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ForumIcon from '@mui/icons-material/Forum';
import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';
import GnosisTasksList from './GnosisTasksList';
import IntegrationCard from './IntegrationCard';

type TaskType = 'multisig' | 'bounty' | 'proposal' | 'discussion'

function iconForTask (taskType: TaskType) {
  switch (taskType) {
    case 'multisig': {
      return <KeyIcon />;
    }
    case 'bounty': {
      return <BountyIcon />;
    }
    case 'proposal': {
      return <HowToVoteIcon />;
    }
    case 'discussion': {
      return <ForumIcon />;
    }
    default: {
      return <KeyIcon />;
    }
  }
}

const TasksPageContainer = styled.div`
  width: 1105px;
  padding: 0 80px;
  margin: 0 auto;
  ${({ theme }) => `
    ${theme.breakpoints.down('md')} {
      width: 100%;
      padding: 0 10px;
    }
  `}
`;

export default function TasksPage () {
  const [currentTab, setCurrentTab] = useState<TaskType>('multisig');
  const theme = useTheme();

  return (
    <TasksPageContainer>
      <Box display='flex' justifyContent='space-between' mb={3}>
        <Typography variant='h1' fontWeight='bold'>Personal Nexus</Typography>
      </Box>
      <IntegrationCard />
      <Legend>
        My tasks
      </Legend>
      <Tabs
        variant='scrollable'
        scrollButtons='auto'
        textColor='primary'
        indicatorColor='secondary'
        value={currentTab}
        sx={{
          '.MuiTab-root': {
            p: {
              xs: 0,
              sm: 1
            },
            minWidth: {
              xs: 'fit-content',
              sm: '90px'
            }
          },
          '&': {
            minHeight: {
              xs: '34px',
              sm: '48px'
            }
          }
        }}
      >
        {(['multisig', 'bounty', 'proposal', 'discussion'] as const).map(tab => (
          <Tab
            component='div'
            key={tab}
            disableRipple
            label={(
              <Button
                sx={{
                  [theme.breakpoints.down('sm')]: {
                    '& .MuiButton-startIcon': {
                      display: 'none'
                    }
                  }
                }}
                startIcon={iconForTask(tab)}
                variant='text'
                size='small'
                onClick={() => setCurrentTab(tab)}
                color={currentTab === tab ? 'textPrimary' : 'secondary'}
              >
                {tab.toUpperCase()}
              </Button>
            )}
            value={tab}
          />
        ))}
      </Tabs>
      {currentTab === 'multisig' ? <GnosisTasksList /> : null}
    </TasksPageContainer>
  );
}
