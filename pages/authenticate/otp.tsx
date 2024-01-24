import Box from '@mui/material/Box';

import { getLayout } from 'components/common/BaseLayout/getLayout';
import { LoginValidationCodeModal } from 'components/settings/account/components/otp/components/LoginValidationCodeModal';

export default function Otp() {
  return getLayout(
    <Box height='100vh' width='100vw' display='flex' alignItems='center' justifyContent='center'>
      <LoginValidationCodeModal open={true} />
    </Box>
  );
}
