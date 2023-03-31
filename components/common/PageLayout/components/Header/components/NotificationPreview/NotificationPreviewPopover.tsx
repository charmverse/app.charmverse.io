import CelebrationIcon from '@mui/icons-material/Celebration';
import { Box, Card, Divider, Typography } from '@mui/material';
import { Fragment } from 'react';

import { useNotificationPreview } from 'components/common/PageLayout/components/Header/components/NotificationPreview/useNotificationPreview';

import { NotificationPreview } from './NotificationPreview';

export function NotificationPreviewPopover({
  onSeeAllClick,
  close
}: {
  onSeeAllClick: VoidFunction;
  close: VoidFunction;
}) {
  const { notificationPreviews, markAsRead } = useNotificationPreview();

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
          notificationPreviews.map((notification) => (
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
              You are up date!
            </Typography>
            <CelebrationIcon color='secondary' fontSize='medium' />
          </Box>
        )}
      </Box>
      <Card>
        <Box
          onClick={onSeeAllClick}
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
    </Box>
  );
}
