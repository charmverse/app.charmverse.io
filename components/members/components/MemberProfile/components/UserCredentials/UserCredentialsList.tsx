import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import MedalIcon from '@mui/icons-material/WorkspacePremium';
import { Alert, Box, Card, Divider, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';

import { useGetUserCredentials } from 'charmClient/hooks/credentials';
import { DraggableListItem } from 'components/common/DraggableListItem';
import LoadingComponent from 'components/common/LoadingComponent';
import { useFavoriteCredentials } from 'hooks/useFavoriteCredentials';
import type { EASAttestationWithFavorite } from 'lib/credentials/external/getOnchainCredentials';

import { UserCredentialRow } from './UserCredentialRow';

export function UserFavoriteList({
  credentials,
  hideTitle = false,
  readOnly = false
}: {
  credentials: EASAttestationWithFavorite[];
  hideTitle?: boolean;
  readOnly?: boolean;
}) {
  const { reorderFavorites } = useFavoriteCredentials();
  return (
    <Stack gap={1}>
      {!hideTitle && (
        <Typography variant='h6' fontWeight='bold'>
          Favorites
        </Typography>
      )}
      {credentials.length === 0 ? (
        <Card variant='outlined'>
          <Box p={3} textAlign='center'>
            <StarOutlinedIcon fontSize='large' color='secondary' />
            <Typography color='secondary'>No credentials added to favorites</Typography>
          </Box>
        </Card>
      ) : (
        <Stack gap={1}>
          {credentials.map((credential) =>
            !readOnly ? (
              <DraggableListItem
                key={credential.id}
                name='credentialItem'
                itemId={credential.favoriteCredentialId!}
                changeOrderHandler={reorderFavorites}
              >
                <UserCredentialRow credential={credential} />
                <Divider sx={{ mt: 1 }} />
              </DraggableListItem>
            ) : (
              <Box key={credential.id}>
                <UserCredentialRow readOnly credential={credential} />
                <Divider sx={{ mt: 1 }} />
              </Box>
            )
          )}
        </Stack>
      )}
    </Stack>
  );
}

export function UserAllCredentialsList({
  credentials,
  hideTitle = false,
  readOnly = false
}: {
  hideTitle?: boolean;
  credentials: EASAttestationWithFavorite[];
  readOnly?: boolean;
}) {
  return (
    <Stack gap={1}>
      {!hideTitle && (
        <Typography variant='h6' fontWeight='bold'>
          All
        </Typography>
      )}
      {credentials?.map((credential) => (
        <Box key={credential.id}>
          <UserCredentialRow readOnly={readOnly} credential={credential} />
          <Divider sx={{ mt: 1 }} />
        </Box>
      ))}
    </Stack>
  );
}

export function UserCredentialsList({ userId, readOnly = false }: { readOnly?: boolean; userId: string }) {
  const { data: userCredentials, error, isLoading } = useGetUserCredentials({ userId });
  const favoriteCredentials = userCredentials
    ?.filter((credential) => credential.favoriteCredentialId)
    .slice(0, 5)
    .sort((a, b) => (a.index || 0) - (b.index || 0));

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

  return (
    <Stack gap={2}>
      <UserFavoriteList credentials={favoriteCredentials ?? []} />
      {userCredentials?.length ? <UserAllCredentialsList readOnly={readOnly} credentials={userCredentials} /> : null}
    </Stack>
  );
}
