import CelebrationIcon from '@mui/icons-material/Celebration';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import { Box, Dialog, DialogContent, Divider, IconButton, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { Fragment } from 'react';

import Legend from 'components/settings/Legend';
import { useSmallScreen } from 'hooks/useMediaScreens';

import { SectionName } from '../../../Sidebar/Sidebar';

import { NotificationPreview } from './NotificationPreview';
import { useNotificationPreview } from './useNotificationPreview';

export function NotificationModal({ isOpen, onClose }: { isOpen: boolean; onClose?: () => void }) {
  const settingsModalState = usePopupState({ variant: 'dialog', popupId: 'settings-dialog' });

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
        </Box>
        <Box flex='1 1 auto' position='relative' overflow='auto'>
          {isMobile && (
            <Box
              display='flex'
              justifyContent='space-between'
              px={2}
              pt={1}
              position={{ xs: 'sticky', md: 'absolute' }}
              top={0}
              right={0}
              zIndex={1}
              sx={{ backgroundColor: (theme) => theme.palette.background.paper }}
            >
              <IconButton aria-label='open settings dialog menu' onClick={() => settingsModalState.open}>
                <MenuIcon />
              </IconButton>
            </Box>
          )}
          <Box role='tabpanel'>
            <DialogContent>
              <Legend marginTop={0}>Notifications</Legend>

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
