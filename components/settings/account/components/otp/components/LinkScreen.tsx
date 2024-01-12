import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import { Button } from 'components/common/Button';

import { useTwoFactorAuth } from '../hooks/useTwoFactorAuth';

import { CanvasQRCode } from './CanvasQrCode';

export function LinkScreen() {
  const [showCode, setShowCode] = useState(false);
  const { data, setFlow } = useTwoFactorAuth();

  return (
    <Box>
      <Typography variant='h5' mb={2}>
        Link the app to your CharmVerse account
      </Typography>
      <Typography>
        Use your authentication app to scan this QR code. If you don't have an authentication app on your device, you'll
        need to install one now.
      </Typography>
      {data && (
        <Box display='flex' alignItems='center' flexDirection='column'>
          <CanvasQRCode uri={data.uri} />
          <Button variant='text' onClick={() => setShowCode(true)}>
            Can't scan the QR code?
          </Button>
          {showCode && <Typography>{data.code}</Typography>}
          <Button onClick={() => setFlow('confirmation')} sx={{ mt: 2 }}>
            NEXT
          </Button>
        </Box>
      )}
    </Box>
  );
}
