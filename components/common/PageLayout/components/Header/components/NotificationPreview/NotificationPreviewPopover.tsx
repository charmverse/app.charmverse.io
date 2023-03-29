import CelebrationIcon from '@mui/icons-material/Celebration';
import { Box, Card, Divider, Typography } from '@mui/material';

import { useNotificationPreview } from 'components/common/PageLayout/components/Header/components/NotificationPreview/useNotificationPreview';

import { NotificationPreview } from './NotificationPreview';

export function NotificationPreviewPopover({ onSeeAllClick }: { onSeeAllClick: () => void }) {
  const { notificationPreviews, markAsRead } = useNotificationPreview();

  return (
    <Box>
      <Card>
        <Typography fontWeight={600} p={2}>
          Notifications
        </Typography>
      </Card>
      <Divider />
      <Box height={400} sx={{ overflowY: 'auto', overflowX: 'hidden' }}>
        {notificationPreviews.length > 0 ? (
          notificationPreviews.map((task) => (
            <>
              <NotificationPreview key={task.id} task={task} markAsRead={markAsRead} />
              <Divider />
            </>
          ))
        ) : (
          <Box display='flex' justifyContent='center' alignItems='center' flexDirection='column' height='100%'>
            <Typography variant='h5' color='secondary'>
              You are up date!
            </Typography>
            <CelebrationIcon color='secondary' fontSize='large' />
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
