import Box from '@mui/material/Box';

import { getLayout } from 'components/common/BaseLayout/getLayout';
import { VerifyLoginOtpModal } from 'components/login/components/VerifyLoginOtpModal';

export default function Otp() {
  return getLayout(
    <Box height='100vh' width='100vw' display='flex' alignItems='center' justifyContent='center'>
      <VerifyLoginOtpModal open={true} />
    </Box>
  );
}
