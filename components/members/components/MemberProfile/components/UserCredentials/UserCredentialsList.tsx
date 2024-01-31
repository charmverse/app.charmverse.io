import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import MedalIcon from '@mui/icons-material/WorkspacePremium';
import { Alert, Box, Card, Divider, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import type { KeyedMutator } from 'swr';

import { useGetUserCredentials } from 'charmClient/hooks/credentialHooks';
import LoadingComponent from 'components/common/LoadingComponent';
import { useUser } from 'hooks/useUser';
import type { EASAttestationWithFavorite } from 'lib/credentials/external/getExternalCredentials';

import { UserCredentialRow } from './UserCredentialRow';

function UserFavoriteList({
  credentials,
  mutateUserCredentials
}: {
  credentials: EASAttestationWithFavorite[];
  mutateUserCredentials?: KeyedMutator<EASAttestationWithFavorite[]>;
}) {
  return (
    <Stack gap={1}>
      <Typography variant='h6' fontWeight='bold'>
        Favorites
      </Typography>
      {credentials.length === 0 ? (
        <Card variant='outlined'>
          <Box p={3} textAlign='center'>
            <StarOutlinedIcon fontSize='large' color='secondary' />
            <Typography color='secondary'>No credentials added to favorites</Typography>
          </Box>
        </Card>
      ) : (
        <Stack gap={1}>
          {credentials.map((credential) => (
            <Box key={credential.id}>
              <UserCredentialRow mutateUserCredentials={mutateUserCredentials} credential={credential} />
              <Divider sx={{ mt: 1 }} />
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export function UserCredentialsList({ userId }: { userId: string }) {
  const { data: userCredentials, error, isLoading, mutate: mutateUserCredentials } = useGetUserCredentials({ userId });
  const favoriteCredentials = userCredentials?.filter((credential) => credential.favorite).slice(0, 5);
  const nonFavoriteCredentials = userCredentials?.filter((credential) => !credential.favorite);
  const { user } = useUser();

  if (!userCredentials && isLoading) {
    return (
      <Stack gap={1}>
        <LoadingComponent />
      </Stack>
    );
  }

  if (error && !isLoading) {
    return <Alert severity='warning'>Error loading credentials</Alert>;
  }

  if (userCredentials?.length === 0 && !isLoading) {
    return (
      <Card variant='outlined'>
        <Box p={3} textAlign='center'>
          <MedalIcon fontSize='large' color='secondary' />
          <Typography color='secondary'>No credentials found</Typography>
        </Box>
      </Card>
    );
  }

  if (user?.id === userId) {
    return (
      <Stack gap={2}>
        <UserFavoriteList mutateUserCredentials={mutateUserCredentials} credentials={favoriteCredentials ?? []} />
        {nonFavoriteCredentials?.length ? (
          <Stack gap={1}>
            <Typography variant='h6' fontWeight='bold'>
              Credentials
            </Typography>
            {nonFavoriteCredentials?.map((credential) => (
              <Box key={credential.id}>
                <UserCredentialRow mutateUserCredentials={mutateUserCredentials} credential={credential} />
                <Divider sx={{ mt: 1 }} />
              </Box>
            ))}
          </Stack>
        ) : null}
      </Stack>
    );
  }

  return <UserFavoriteList credentials={favoriteCredentials ?? []} />;
}
