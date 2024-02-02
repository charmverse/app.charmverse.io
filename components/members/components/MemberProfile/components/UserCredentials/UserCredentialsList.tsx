import MedalIcon from '@mui/icons-material/WorkspacePremium';
import { Alert, Box, Card, Divider, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';

import { useGetUserCredentials } from 'charmClient/hooks/credentialHooks';
import LoadingComponent from 'components/common/LoadingComponent';
import { useSmallScreen } from 'hooks/useMediaScreens';

import { UserCredentialRow } from './UserCredentialRow';

export function UserCredentialsList({ userId }: { userId: string }) {
  const { data: userCredentials, error, isLoading } = useGetUserCredentials({ userId });

  return (
    <Stack
      gap={{
        xs: 2,
        md: 1
      }}
    >
      {!userCredentials && isLoading && <LoadingComponent />}
      {userCredentials?.length === 0 && !isLoading && (
        <Card variant='outlined'>
          <Box p={3} textAlign='center'>
            <MedalIcon fontSize='large' color='secondary' />
            <Typography color='secondary'>No credentials found</Typography>
          </Box>
        </Card>
      )}
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
