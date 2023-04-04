import CelebrationIcon from '@mui/icons-material/Celebration';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import CommentIcon from '@mui/icons-material/Comment';
import ForumIcon from '@mui/icons-material/Forum';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import KeyIcon from '@mui/icons-material/Key';
import LayersIcon from '@mui/icons-material/Layers';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Badge, Box, Dialog, DialogContent, Divider, IconButton, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import router from 'next/router';
import { Fragment, useState } from 'react';

import { tabStyles } from 'components/nexus/TasksPage';
import Legend from 'components/settings/Legend';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import { SectionName } from '../../../Sidebar/Sidebar';
import { SidebarLink } from '../../../Sidebar/SidebarButton';

import { NotificationPreview } from './NotificationPreview';
import type { NotificationDetails } from './useNotificationPreview';
import { useNotificationPreview } from './useNotificationPreview';

const TASK_TABS = [
  { icon: <LayersIcon />, label: 'All', type: 'all' },
  { icon: <KeyIcon />, label: 'Multisig', type: 'multisig' },
  { icon: <BountyIcon />, label: 'Bounty', type: 'bounty' },
  { icon: <HowToVoteIcon />, label: 'Poll', type: 'vote' },
  { icon: <ForumIcon />, label: 'Discussion', type: 'mention' },
  { icon: <TaskOutlinedIcon />, label: 'Proposal', type: 'proposal' },
  { icon: <CommentIcon />, label: 'Forum', type: 'forum' }
] as const;

export function NotificationModal({
  isOpen,
  onClose,
  unmarkedNotifications
}: {
  isOpen: boolean;
  onClose: VoidFunction;
  unmarkedNotifications: NotificationDetails[];
}) {
  const { markAsRead, markedNotificationPreviews } = useNotificationPreview();
  const isMobile = useSmallScreen();
  type TaskType = (typeof TASK_TABS)[number]['type'];

  const [currentTaskType, setCurrentTaskType] = useState<TaskType>('all');

  const notificationCount: Record<(typeof TASK_TABS)[number]['type'], boolean> = {
    vote: !!unmarkedNotifications.find((n) => n.type === 'vote'),
    mention: !!unmarkedNotifications.find((n) => n.type === 'mention'),
    proposal: !!unmarkedNotifications.find((n) => n.type === 'proposal'),
    bounty: !!unmarkedNotifications.find((n) => n.type === 'bounty'),
    forum: !!unmarkedNotifications.find((n) => n.type === 'forum'),
    all: false,
    multisig: false
  };

  function seletedUnmarkedNotifications() {
    if (currentTaskType === 'all') {
      return unmarkedNotifications;
    } else {
      return unmarkedNotifications.filter((n) => n.type === currentTaskType);
    }
  }

  function seletedMarkedNotifications() {
    if (currentTaskType === 'all') {
      return markedNotificationPreviews;
    } else {
      return markedNotificationPreviews.filter((n) => n.type === currentTaskType);
    }
  }

  return (
    <Dialog
      fullWidth
      maxWidth='lg'
      fullScreen={isMobile}
      PaperProps={{ sx: { height: { md: '90vh' }, borderRadius: (theme) => theme.spacing(1) } }}
      onClose={onClose}
      open={isOpen}
    >
      <Box display='flex' flexDirection='row' flex='1' overflow='hidden'>
        <Box
          component='aside'
          display={isMobile ? 'none' : 'block'}
          width={{ xs: '100%', md: 250 }}
          minWidth={{ xs: '100%', md: 250 }}
          overflow='auto'
          sx={{ backgroundColor: (theme) => theme.palette.sidebar.background }}
        >
          <Box mt={2} py={0.5}>
            <SectionName>Notification Type</SectionName>
          </Box>
          {TASK_TABS.map((tab) => (
            <SidebarLink
              key={tab.label}
              label={tab.label}
              icon={
                <Badge
                  sx={{
                    '& .MuiBadge-badge': {
                      right: {
                        md: 26
                      },
                      top: {
                        md: 0,
                        xs: -20
                      }
                    }
                  }}
                  invisible={!notificationCount[tab.type]}
                  color='error'
                  variant='dot'
                >
                  {tab.icon}
                </Badge>
              }
              onClick={() => setCurrentTaskType(tab.type)}
              active={tab.type === currentTaskType}
            />
          ))}
        </Box>
        <Box flex='1 1 auto' position='relative' overflow='auto'>
          <Box role='tabpanel' height='100%'>
            <DialogContent sx={{ height: '100%' }}>
              <Legend
                variant='inherit'
                variantMapping={{ inherit: 'div' }}
                display='flex'
                justifyContent='space-between'
              >
                <Typography variant='h2' fontSize='inherit' textTransform='capitalize' fontWeight={700}>
                  {`${currentTaskType} Notifications`}
                </Typography>
                <Box display='flex' alignItems='center' gap={{ sm: 2, xs: 1 }}>
                  <Tooltip title='Mark all as read'>
                    <IconButton aria-label='close the notifications modal' onClick={() => null}>
                      <CheckCircleIcon color='secondary' fontSize='small' />
                    </IconButton>
                  </Tooltip>
                  <IconButton aria-label='close the notifications modal' onClick={onClose}>
                    <CloseIcon color='secondary' fontSize='small' />
                  </IconButton>
                </Box>
              </Legend>
              {isMobile && (
                <Tabs
                  sx={tabStyles}
                  indicatorColor='primary'
                  value={TASK_TABS.findIndex((taskTab) => taskTab.type === currentTaskType)}
                >
                  {TASK_TABS.map((task) => (
                    <Tab
                      component='div'
                      disableRipple
                      iconPosition='start'
                      icon={
                        <>
                          <Badge
                            invisible={!notificationCount[task.type]}
                            sx={{ left: -15, marginTop: 1 }}
                            color='error'
                            variant='dot'
                          />
                          {task.icon}
                        </>
                      }
                      key={task.label}
                      sx={{
                        px: 1.5,
                        fontSize: 14,
                        minHeight: 0,
                        mb: {
                          xs: 1,
                          md: 0
                        },
                        '&.MuiTab-root': {
                          color: (theme) => theme.palette.secondary.main,
                          display: 'flex',
                          flexDirection: {
                            xs: 'column',
                            md: 'row'
                          }
                        },
                        '& .MuiSvgIcon-root': {
                          mr: {
                            xs: 0,
                            md: 1
                          }
                        }
                      }}
                      label={task.label}
                      onClick={() => {
                        setUrlWithoutRerender(router.pathname, { task: task.type });
                        setCurrentTaskType(task.type);
                      }}
                    />
                  ))}
                </Tabs>
              )}
              {seletedUnmarkedNotifications().map((notification) => (
                <Fragment key={notification.taskId}>
                  <NotificationPreview
                    large
                    unmarked
                    notification={notification}
                    markAsRead={markAsRead}
                    onClose={onClose}
                  />
                  <Divider />
                </Fragment>
              ))}
              {seletedMarkedNotifications().map((notification) => (
                <Fragment key={notification.taskId}>
                  <NotificationPreview large notification={notification} markAsRead={markAsRead} onClose={onClose} />
                  <Divider />
                </Fragment>
              ))}

              {seletedUnmarkedNotifications()?.length < 1 && seletedMarkedNotifications()?.length < 1 && (
                <Box
                  display='flex'
                  justifyContent='center'
                  alignItems='center'
                  flexDirection='row'
                  height='calc(100% - 70px)'
                  gap={1}
                >
                  <Typography variant='h5' color='secondary'>
                    You are up to date!
                  </Typography>
                  <CelebrationIcon color='secondary' fontSize='large' />
                </Box>
              )}
            </DialogContent>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
