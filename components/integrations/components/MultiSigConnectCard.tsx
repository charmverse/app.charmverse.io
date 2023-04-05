import { Box, Card, Tooltip, Typography } from '@mui/material';

import Button from 'components/common/Button';

export function MultiSigConnectCard({
  loading,
  onClick,
  connectable
}: {
  loading: boolean;
  onClick: () => void;
  connectable: boolean;
}) {
  return (
    <Card variant='outlined'>
      <Box p={3} textAlign='center'>
        <Typography color='secondary'>Import your Gnosis safes.</Typography>
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
