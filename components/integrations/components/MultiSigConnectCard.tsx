import { Box, Card, Tooltip, Typography } from '@mui/material';
import { useRouter } from 'next/router';

import Button from 'components/common/Button';

export function MultiSigConnectCard({
  loading,
  onClick,
  connectable,
  openNotificationsTab
}: {
  loading: boolean;
  onClick: () => void;
  connectable: boolean;
  openNotificationsTab: () => void;
}) {
  const router = useRouter();
  const isTasksPage = router.pathname.includes('/tasks');

  return (
    <Card variant='outlined'>
      <Box p={3} textAlign='center'>
        <Typography color='secondary'>
          Import your Gnosis safes to view your transaction queue
          {!isTasksPage && (
            <>
              {' '}
              under{' '}
              <Button variant='text' onClick={openNotificationsTab}>
                My Tasks
              </Button>
            </>
          )}
        </Typography>
        <br />
        <Tooltip title={!connectable ? 'Please unlock your wallet and ensure it is connected to your account.' : ''}>
          <Box>
            <Button disabled={!connectable} loading={loading} onClick={onClick}>
              Connect Gnosis Safe
            </Button>
          </Box>
        </Tooltip>
      </Box>
    </Card>
  );
}
