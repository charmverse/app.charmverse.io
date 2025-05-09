import MedalIcon from '@mui/icons-material/WorkspacePremium';
import { Alert, Box, Card, Divider, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import type { EASAttestationWithFavorite } from '@packages/credentials/external/getOnchainCredentials';

import { useGetUserCredentials } from 'charmClient/hooks/credentials';
import type { DraggableListItemProps } from 'components/common/DraggableListItem';
import { DraggableListItem } from 'components/common/DraggableListItem';
import LoadingComponent from 'components/common/LoadingComponent';
import { useFavoriteCredentials } from 'hooks/useFavoriteCredentials';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';

import type { UserCredentialRowProps } from './UserCredentialRow';
import { UserCredentialRow } from './UserCredentialRow';

function UserCredentialRowWithDivider({
  credential,
  smallScreen,
  readOnly,
  ...props
}: UserCredentialRowProps & Partial<DraggableListItemProps>) {
  const row = <UserCredentialRow credential={credential} smallScreen={smallScreen} readOnly={readOnly} />;

  // Credential might be empty, so we don't want to render a list of dividers
  if (row) {
    if (props.changeOrderHandler && props.name && props.itemId) {
      return (
        <Box>
          <DraggableListItem {...(props as any)}>{row}</DraggableListItem>
          <Divider sx={{ mt: 1 }} />
        </Box>
      );
    }
    return (
      <Box>
        {row}
        <Divider sx={{ mt: 1 }} />
      </Box>
    );
  }
  return null;
}

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
            <UserCredentialRowWithDivider
              key={credential.id}
              name='credentialItem'
              itemId={credential.favoriteCredentialId!}
              changeOrderHandler={reorderFavorites}
              smallScreen={smallScreen}
              credential={credential}
            />
          ) : (
            <UserCredentialRowWithDivider
              key={credential.id}
              smallScreen={smallScreen}
              readOnly
              credential={credential}
            />
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
        <UserCredentialRowWithDivider
          key={credential.id}
          smallScreen={smallScreen}
          readOnly={readOnly}
          credential={credential}
        />
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
