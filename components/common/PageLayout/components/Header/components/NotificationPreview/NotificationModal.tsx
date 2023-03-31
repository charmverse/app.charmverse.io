import CelebrationIcon from '@mui/icons-material/Celebration';
import CloseIcon from '@mui/icons-material/Close';
import { Badge, Box, Dialog, DialogContent, Divider, IconButton, Tab, Tabs, Typography } from '@mui/material';
import router from 'next/router';
import { Fragment } from 'react';

import { tabStyles } from 'components/nexus/TasksPage';
import Legend from 'components/settings/Legend';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import { SectionName } from '../../../Sidebar/Sidebar';
import { SidebarLink } from '../../../Sidebar/SidebarButton';

import { NotificationPreview } from './NotificationPreview';
import { TASK_TABS, useNotificationPreview } from './useNotificationPreview';

export function NotificationModal({ isOpen, onClose }: { isOpen: boolean; onClose?: () => void }) {
  const { notificationPreviews, markAsRead } = useNotificationPreview();
  const isMobile = useSmallScreen();

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
              icon={tab.icon}
              // onClick={() => onClick(tab.path)}
              active={tab.label === 'All'}
            />
          ))}
        </Box>
        <Box flex='1 1 auto' position='relative' overflow='auto'>
          <Box role='tabpanel'>
            <DialogContent>
              <Legend marginTop={0}>Notifications</Legend>

              {isMobile && (
                <Tabs
                  sx={tabStyles}
                  indicatorColor='primary'
                  // currentTaskType
                  value={TASK_TABS.findIndex((taskTab) => taskTab.type === 'all')}
                >
                  {TASK_TABS.map((task) => (
                    <Tab
                      component='div'
                      disableRipple
                      iconPosition='start'
                      icon={task.icon}
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
                      label={
                        <Badge
                          sx={{
                            '& .MuiBadge-badge': {
                              right: {
                                md: -3,
                                xs: 15
                              },
                              top: {
                                md: 0,
                                xs: -20
                              }
                            }
                          }}
                          // invisible={notificationCount[task.type] === 0}
                          color='error'
                          variant='dot'
                        >
                          {task.label}
                        </Badge>
                      }
                      onClick={() => {
                        setUrlWithoutRerender(router.pathname, { task: task.type });
                        // setCurrentTaskType(task.type);
                      }}
                    />
                  ))}
                </Tabs>
              )}

              {notificationPreviews.length > 0 ? (
                notificationPreviews.map((notification) => (
                  <Fragment key={notification.taskId}>
                    <NotificationPreview
                      large
                      notification={notification}
                      markAsRead={markAsRead}
                      onClose={() => onClose}
                    />
                    <Divider />
                  </Fragment>
                ))
              ) : (
                <Box display='flex' justifyContent='center' alignItems='center' flexDirection='column' height='100%'>
                  <Typography variant='h5' color='secondary'>
                    You are up date!
                  </Typography>
                  <CelebrationIcon color='secondary' fontSize='large' />
                </Box>
              )}
            </DialogContent>
          </Box>
        </Box>
        <IconButton
          data-test='close-settings-modal'
          aria-label='close the settings modal'
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 15,
            top: 15,
            zIndex: 1
          }}
        >
          <CloseIcon color='secondary' fontSize='small' />
        </IconButton>
      </Box>
    </Dialog>
  );
}
