import Box from '@mui/material/Box';
import { GoogleAuthProvider } from 'firebase/auth';

import Button from 'components/common/Button';

// Google client setup start
const provider = new GoogleAuthProvider();

provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
// Google client setup end
export function LoginWithAnyId() {
  return (
    <Box>
      <Button size='large' primary>
        Connect with any ID
      </Button>
    </Box>
  );
}
