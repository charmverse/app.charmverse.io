import CelebrationIcon from '@mui/icons-material/Celebration';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import CommentIcon from '@mui/icons-material/Comment';
import ForumIcon from '@mui/icons-material/Forum';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import LayersIcon from '@mui/icons-material/Layers';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Badge, Box, Dialog, DialogContent, Divider, IconButton, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import router from 'next/router';
import { Fragment } from 'react';

import { SectionName } from 'components/common/PageLayout/components/Sidebar/Sidebar';
import { SidebarLink } from 'components/common/PageLayout/components/Sidebar/SidebarButton';
import { tabStyles } from 'components/nexus/TasksPage';
import Legend from 'components/settings/Legend';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import { NotificationPreview } from './NotificationPreview';
import { useNotificationModal } from './useNotificationModal';
import type { MarkNotificationAsRead, NotificationDetails } from './useNotificationPreview';

const NOTIFICATION_TABS = [
  { icon: <LayersIcon />, label: 'All', type: 'all' },
  { icon: <BountyIcon />, label: 'Bounty', type: 'bounty' },
  { icon: <HowToVoteIcon />, label: 'Poll', type: 'vote' },
  { icon: <ForumIcon />, label: 'Discussion', type: 'mention' },
  { icon: <TaskOutlinedIcon />, label: 'Proposal', type: 'proposal' },
  { icon: <CommentIcon />, label: 'Forum', type: 'forum' }
] as const;

export function NotificationModal({
  isOpen,
  onClose,
  unmarkedNotifications: unmarked,
  markedNotifications: marked,
  markAsRead
}: {
  isOpen: boolean;
  onClose: VoidFunction;
  unmarkedNotifications: NotificationDetails[];
  markedNotifications: NotificationDetails[];
  markAsRead: MarkNotificationAsRead;
}) {
  const isMobile = useSmallScreen();

  const {
    markedNotifications,
    unmarkedNotifications,
    hasUnreadNotifications,
    notificationsDisplayType,
    setNotificationsDisplayType,
    markBulkAsRead
  } = useNotificationModal({ marked, unmarked });

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
          {NOTIFICATION_TABS.map((tab) => (
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
                  invisible={!hasUnreadNotifications[tab.type]}
                  color='error'
                  variant='dot'
                >
                  {tab.icon}
                </Badge>
              }
              onClick={() => setNotificationsDisplayType(tab.type)}
              active={tab.type === notificationsDisplayType}
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
                  {`${notificationsDisplayType} Notifications`}
                </Typography>
                <Box display='flex' alignItems='center' gap={{ sm: 2, xs: 1 }}>
                  <Tooltip title='Mark all as read'>
                    <IconButton aria-label='close the notifications modal' onClick={markBulkAsRead}>
                      <CheckCircleIcon color='secondary' fontSize='small' />
                    </IconButton>
                  </Tooltip>
                  <IconButton aria-label='close the notifications modal' onClick={onClose}>
                    <CloseIcon color='secondary' fontSize='small' />
                  </IconButton>
                </Box>
              </Legend>

              <Tabs
                sx={{ ...tabStyles, display: isMobile ? 'block' : 'none' }}
                indicatorColor='primary'
                value={NOTIFICATION_TABS.findIndex((taskTab) => taskTab.type === notificationsDisplayType)}
              >
                {NOTIFICATION_TABS.map((task) => (
                  <Tab
                    component='div'
                    disableRipple
                    iconPosition='start'
                    icon={
                      <>
                        <Badge
                          invisible={!hasUnreadNotifications[task.type]}
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
                      setNotificationsDisplayType(task.type);
                    }}
                  />
                ))}
              </Tabs>

              {unmarkedNotifications.map((notification) => (
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
              {markedNotifications.map((notification) => (
                <Fragment key={notification.taskId}>
                  <NotificationPreview large notification={notification} markAsRead={markAsRead} onClose={onClose} />
                  <Divider />
                </Fragment>
              ))}

              {unmarkedNotifications.length < 1 && markedNotifications.length < 1 && (
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
