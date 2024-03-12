import Box from '@mui/material/Box';
import { useState } from 'react';

import { getLayout } from 'components/common/BaseLayout/getLayout';
import LoadingComponent from 'components/common/LoadingComponent';
import { VerifyLoginOtpModal } from 'components/login/components/VerifyLoginOtpModal';

export default function Otp() {
  const [open, setOpen] = useState(true);
  const handleClose = () => setOpen(false);

  return getLayout(
    <Box height='100vh' width='100vw' display='flex' alignItems='center' justifyContent='center'>
      <VerifyLoginOtpModal open={open} onClose={handleClose} />
      <LoadingComponent isLoading />
    </Box>
  );
}
