import CelebrationIcon from '@mui/icons-material/Celebration';
import { Box, Card, Divider, Typography } from '@mui/material';
import { Fragment, useMemo } from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import { useNotifications } from 'hooks/useNotifications';

import { NotificationPreview } from './NotificationPreview';

const MAX_COUNT = 5;

export function NotificationPreviewPopover({ close }: { close: VoidFunction }) {
  const { isLoading, unmarkedNotificationPreviews, markAsRead, markedNotificationPreviews, openNotificationsModal } =
    useNotifications();

  const latestNotifications = useMemo(() => {
    return [...unmarkedNotificationPreviews, ...markedNotificationPreviews]
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
      .slice(0, MAX_COUNT);
  }, [unmarkedNotificationPreviews, markedNotificationPreviews]);

  return (
    <Box>
      <Card>
        <Typography fontWeight={600} p={2}>
          Latest notifications
        </Typography>
      </Card>
      <Divider />
      <LoadingComponent isLoading={isLoading} label='Fetching your notifications' size={24}>
        <Box maxHeight={500} sx={{ overflowY: 'auto', overflowX: 'hidden' }}>
          {latestNotifications.length > 0 ? (
            latestNotifications.map((notification) => (
              <Fragment key={notification.id}>
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
      </LoadingComponent>

      <Card>
        <Box
          onClick={() => {
            close();
            openNotificationsModal();
          }}
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
