import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { Box, Button, Stack, Typography } from '@mui/material';

export function WalletLogin() {
  return (
    <Box width='100%' data-test='connect-with-farcaster'>
      <Button
        size='large'
        variant='contained'
        sx={{
          minWidth: '250px',
          px: 2.5,
          py: 1.5
        }}
      >
        <Stack direction='row' alignItems='center' gap={1} justifyContent='flex-start' width='100%'>
          <AccountBalanceWalletOutlinedIcon />
          <Typography fontWeight={600} color='white'>
            Sign in with wallet
          </Typography>
        </Stack>
      </Button>
    </Box>
  );
}
