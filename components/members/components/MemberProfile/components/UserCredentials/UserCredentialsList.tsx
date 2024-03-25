import MedalIcon from '@mui/icons-material/WorkspacePremium';
import { Alert, Box, Card, Divider, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';

import { useGetUserCredentials } from 'charmClient/hooks/credentials';
import { DraggableListItem } from 'components/common/DraggableListItem';
import LoadingComponent from 'components/common/LoadingComponent';
import { useFavoriteCredentials } from 'hooks/useFavoriteCredentials';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import type { EASAttestationWithFavorite } from 'lib/credentials/external/getOnchainCredentials';

import { UserCredentialRow } from './UserCredentialRow';

export function UserFavoriteList({
  credentials,
  readOnly = false,
  smallScreen
}: {
  smallScreen?: boolean;
  credentials: EASAttestationWithFavorite[];
  readOnly?: boolean;
}) {
  const { reorderFavorites } = useFavoriteCredentials();
  if (credentials.length === 0) {
    return null;
  }
  return (
    <Stack gap={1}>
      <Stack gap={1}>
        {credentials.map((credential) =>
          !readOnly ? (
            <DraggableListItem
              key={credential.id}
              name='credentialItem'
              itemId={credential.favoriteCredentialId!}
              changeOrderHandler={reorderFavorites}
            >
              <UserCredentialRow smallScreen={smallScreen} credential={credential} />
              <Divider sx={{ mt: 1 }} />
            </DraggableListItem>
          ) : (
            <Box key={credential.id}>
              <UserCredentialRow smallScreen={smallScreen} readOnly credential={credential} />
              <Divider sx={{ mt: 1 }} />
            </Box>
          )
        )}
      </Stack>
    </Stack>
  );
}

export function UserAllCredentialsList({
  credentials,
  readOnly = false,
  smallScreen
}: {
  smallScreen?: boolean;
  credentials: EASAttestationWithFavorite[];
  readOnly?: boolean;
}) {
  return (
    <Stack gap={1}>
      {credentials.map((credential) => (
        <Box key={credential.id}>
          <UserCredentialRow smallScreen={smallScreen} readOnly={readOnly} credential={credential} />
          <Divider sx={{ mt: 1 }} />
        </Box>
      ))}
    </Stack>
  );
}

export function UserCredentialsList({ userId, readOnly = false }: { readOnly?: boolean; userId: string }) {
  const includeTestnets = useIsCharmverseSpace();

  const { data: userCredentials, error, isLoading } = useGetUserCredentials({ userId, includeTestnets });
  const favoriteCredentials = userCredentials
    ?.filter((credential) => credential.favoriteCredentialId)
    .slice(0, 5)
    .sort((a, b) => (a.index || 0) - (b.index || 0));

  if (isLoading) {
    return (
      <Stack gap={1}>
        <LoadingComponent minHeight={300} />
      </Stack>
    );
  }

  if (error) {
    return <Alert severity='warning'>Error loading credentials</Alert>;
  }

  if (!userCredentials?.length) {
    return (
      <Card variant='outlined'>
        <Box p={3} textAlign='center'>
          <MedalIcon fontSize='large' color='secondary' />
          <Typography color='secondary'>No credentials found</Typography>
        </Box>
      </Card>
    );
  }

  const showFavorites = !!favoriteCredentials?.length;

  return (
    <Stack gap={2}>
      {showFavorites && (
        <>
          <Typography variant='h6' fontWeight='bold'>
            Favorites
          </Typography>
          <UserFavoriteList credentials={favoriteCredentials} />
        </>
      )}
      <>
        {showFavorites && (
          <Typography variant='h6' fontWeight='bold'>
            All
          </Typography>
        )}
        <UserAllCredentialsList readOnly={readOnly} credentials={userCredentials} />
      </>
    </Stack>
  );
}
