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
import { Fragment } from 'react';

import { MobileDialog } from 'components/common/MobileDialog/MobileDialog';
import type { NotificationDisplayType } from 'components/common/PageLayout/components/Header/components/NotificationPreview/useNotifications';
import { useNotifications } from 'components/common/PageLayout/components/Header/components/NotificationPreview/useNotifications';
import { SectionName } from 'components/common/PageLayout/components/Sidebar/components/SectionName';
import { SidebarLink } from 'components/common/PageLayout/components/Sidebar/components/SidebarButton';
import Legend from 'components/settings/Legend';
import { useSmallScreen } from 'hooks/useMediaScreens';

import { NotificationPreview } from './NotificationPreview';
import { useNotificationModal } from './useNotificationModal';

const NOTIFICATION_TABS: { icon: JSX.Element; label: string; type: NotificationDisplayType }[] = [
  { icon: <LayersIcon />, label: 'All', type: 'all' },
  { icon: <BountyIcon />, label: 'Bounty', type: 'bounty' },
  { icon: <HowToVoteIcon />, label: 'Poll', type: 'vote' },
  { icon: <ForumIcon />, label: 'Discussion', type: 'mention' },
  { icon: <TaskOutlinedIcon />, label: 'Proposal', type: 'proposal' },
  { icon: <CommentIcon />, label: 'Forum', type: 'forum' }
];

const tabStyles = {
  mt: 2,
  minHeight: {
    xs: '34px',
    sm: '48px'
  },
  '.MuiTab-root': {
    p: 0,
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

export function NotificationModal() {
  const {
    notificationDisplayType,
    markedNotificationPreviews: marked,
    unmarkedNotificationPreviews: unmarked,
    closeNotificationsModal,
    openNotificationsModal,
    markAsRead
  } = useNotifications();
  const isMobile = useSmallScreen();
  const DialogComponent = isMobile ? MobileDialog : Dialog;

  const { markedNotifications, unmarkedNotifications, hasUnreadNotifications, markBulkAsRead } = useNotificationModal({
    marked,
    unmarked,
    notificationDisplayType
  });

  return (
    <DialogComponent
      onClose={closeNotificationsModal}
      open={!!notificationDisplayType}
      fullWidth
      maxWidth='lg'
      contentSx={{ padding: 0 }}
      PaperProps={{
        sx: {
          background: (theme) =>
            theme.palette.mode === 'dark' ? 'var(--background-dark)' : 'var(--background-default)'
        }
      }}
    >
      <Box
        display='flex'
        flexDirection='row'
        flex='1'
        overflow='hidden'
        data-test-notification-tab={notificationDisplayType}
      >
        <Box
          component='aside'
          display={isMobile ? 'none' : 'block'}
          width={{ xs: '100%', md: 250 }}
          minWidth={{ xs: '100%', md: 250 }}
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
              onClick={() => openNotificationsModal(tab.type)}
              active={tab.type === notificationDisplayType}
            />
          ))}
        </Box>
        <Box flex='1 1 auto' position='relative' height={isMobile ? '95vh' : '80vh'} overflow='hidden'>
          <Box role='tabpanel' height='100%'>
            <Box width='100%'>
              <Legend
                variant='inherit'
                variantMapping={{ inherit: 'div' }}
                display='flex'
                justifyContent='space-between'
                px={{ xs: 1, md: 3 }}
                pt={{ xs: 1, md: 3 }}
              >
                <Typography variant={isMobile ? 'h6' : 'h5'} textTransform='capitalize' fontWeight={700}>
                  {`${notificationDisplayType || 'All'} Notifications`}
                </Typography>
                <Box display='flex' alignItems='center' gap={{ sm: 2, xs: 1 }}>
                  {notificationDisplayType && hasUnreadNotifications[notificationDisplayType] && (
                    <Tooltip title='Mark all as read'>
                      <IconButton aria-label='mark notifications as read' onClick={markBulkAsRead}>
                        <CheckCircleIcon color='secondary' fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  )}
                  <IconButton aria-label='close the notifications modal' onClick={closeNotificationsModal}>
                    <CloseIcon color='secondary' fontSize='small' />
                  </IconButton>
                </Box>
              </Legend>
              <Tabs
                sx={{ ...tabStyles, display: isMobile ? 'block' : 'none' }}
                indicatorColor='primary'
                value={NOTIFICATION_TABS.findIndex((taskTab) => taskTab.type === notificationDisplayType)}
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
                      fontSize: 12,
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
                      openNotificationsModal(task.type);
                    }}
                  />
                ))}
              </Tabs>
            </Box>
            <DialogContent sx={{ height: 'calc(100% - 145px)', px: { xs: 0, md: 3 } }}>
              {unmarkedNotifications.map((notification) => (
                <Fragment key={notification.taskId}>
                  <NotificationPreview
                    large
                    unmarked
                    notification={notification}
                    markAsRead={markAsRead}
                    onClose={closeNotificationsModal}
                  />
                  <Divider />
                </Fragment>
              ))}
              {markedNotifications.map((notification) => (
                <Fragment key={notification.taskId}>
                  <NotificationPreview
                    large
                    notification={notification}
                    markAsRead={markAsRead}
                    onClose={closeNotificationsModal}
                  />
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
    </DialogComponent>
  );
}
