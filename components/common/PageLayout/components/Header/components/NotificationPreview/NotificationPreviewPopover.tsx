import CelebrationIcon from '@mui/icons-material/Celebration';
import { Box, Card, Divider, Typography } from '@mui/material';
import { Fragment, useState } from 'react';

import { NotificationModal } from './NotificationModal';
import { NotificationPreview } from './NotificationPreview';
import { useNotificationPreview } from './useNotificationPreview';

export function NotificationPreviewPopover({
  onSeeAllClick,
  close
}: {
  onSeeAllClick: VoidFunction;
  close: VoidFunction;
}) {
  const { notificationPreviews, markAsRead } = useNotificationPreview();
  const [openNotificationsModal, setOpenNotificationsModal] = useState(false);
  const MAX_COUNT = 5;

  return (
    <Box>
      <Card>
        <Typography fontWeight={600} p={2}>
          Latest notifications
        </Typography>
      </Card>
      <Divider />
      <Box maxHeight={500} sx={{ overflowY: 'auto', overflowX: 'hidden' }}>
        {notificationPreviews.length > 0 ? (
          notificationPreviews.slice(0, MAX_COUNT).map((notification) => (
            <Fragment key={notification.taskId}>
              <NotificationPreview notification={notification} markAsRead={markAsRead} onClose={close} />
              <Divider />
            </Fragment>
          ))
        ) : (
          <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            flexDirection='row'
            height='100%'
            my={2}
            gap={1}
          >
            <Typography variant='h6' color='secondary'>
              You are up to date!
            </Typography>
            <CelebrationIcon color='secondary' fontSize='medium' />
          </Box>
        )}
      </Box>
      <Card>
        <Box
          onClick={() => setOpenNotificationsModal(true)}
          display='flex'
          alignItems='center'
          justifyContent='center'
          sx={{ cursor: 'pointer' }}
          p={2}
        >
          <Typography variant='body1' color='primary' fontWeight={600}>
            See All Notifications
          </Typography>
        </Box>
      </Card>
      <NotificationModal
        isOpen={openNotificationsModal}
        onClose={() => setOpenNotificationsModal(false)}
        unmarkedNotifications={notificationPreviews}
      />
    </Box>
  );
}
