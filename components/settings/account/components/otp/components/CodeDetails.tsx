import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import { Button } from 'components/common/Button';

import { CanvasQRCode } from './CanvasQrCode';

type Props = {
  uri: string;
  code: string;
  btnText: string;
  onSubmit: () => void;
};

export function CodeDetails({ onSubmit, uri, code, btnText }: Props) {
  const [showCode, setShowCode] = useState(false);

  return (
    <Box>
      <Typography variant='h5' mb={2}>
        Link the app to your CharmVerse account
      </Typography>
      <Typography>
        Use your authentication app to scan this QR code. If you don't have an authentication app on your device, you'll
        need to install one now.
      </Typography>
      <Box display='flex' alignItems='center' flexDirection='column'>
        <CanvasQRCode uri={uri} />
        <Button variant='text' onClick={() => setShowCode(true)} data-test='see-auth-confirmation-code'>
          Can't scan the QR code?
        </Button>
        {showCode && <Typography data-test='auth-confirmation-code'>{code}</Typography>}
        <Button onClick={onSubmit} sx={{ mt: 2 }} data-test='two-factor-auth-next'>
          {btnText}
        </Button>
      </Box>
    </Box>
  );
}
