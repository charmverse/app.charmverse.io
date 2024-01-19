import { Alert, Box, Divider } from '@mui/material';
import Stack from '@mui/material/Stack';

import LoadingComponent from 'components/common/LoadingComponent';
import { useGetUserCredentials } from 'components/settings/credentials/hooks/credentialHooks';

import { UserCredentialRow } from './UserCredentialRow';

export function UserCredentialsList({ userId }: { userId: string }) {
  const { data: userCredentials, error, isLoading } = useGetUserCredentials({ userId });
  return (
    <Stack gap={1}>
      {!userCredentials && isLoading && <LoadingComponent />}
      {error && !isLoading && <Alert severity='warning'>Error loading credentials</Alert>}
      {userCredentials?.map((credential) => (
        <Box key={credential.id}>
          <UserCredentialRow credential={credential} />
          <Divider sx={{ mt: 1 }} />
        </Box>
      ))}
    </Stack>
  );
}
