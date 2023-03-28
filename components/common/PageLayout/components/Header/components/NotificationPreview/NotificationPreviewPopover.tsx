import { Box, Card, Divider, Typography } from '@mui/material';

import { useNotificationPreview } from 'components/common/PageLayout/components/Header/components/NotificationPreview/useNotificationPreview';

import { NotificationPreview } from './NotificationPreview';

export function NotificationPreviewPopover({ onSeeAllClick }: { onSeeAllClick: () => void }) {
  const { notificationPreviews } = useNotificationPreview();

  return (
    <Box>
      <Card>
        <Typography fontWeight={600} p={2}>
          Notifications
        </Typography>
      </Card>
      <Divider />
      <Box height={400} sx={{ overflowY: 'auto', overflowX: 'hidden' }}>
        {notificationPreviews.map((t) => (
          <>
            <NotificationPreview
              key={t.id}
              id={t.id}
              createdAt={t.createdAt}
              spaceName={t.spaceName}
              title={t.title}
              type={t.type}
              groupType={t.groupType}
              createdBy={t.createdBy}
            />
            <Divider />
          </>
        ))}
        {/* {arr.map((index) => (
          <>
            <NotificationPreview
              key={index}
              id={index.toString()}
              createdAt='12/12/2012'
              spaceName='Space Name WWWWWWWWWWW '
              title='WWWWWW WWWWWssc vbcvdfgd fgdfg gdfggdfgdd bcbbss '
              type='Multisig'
              createdBy={null}
            />
            <Divider />
          </>
        ))} */}
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
