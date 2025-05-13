import MedalIcon from '@mui/icons-material/WorkspacePremium';
import { Stack } from '@mui/material';
import type { EASAttestationWithFavorite } from '@packages/credentials/external/getOnchainCredentials';
import type { Dispatch, SetStateAction } from 'react';

import { Button } from 'components/common/Button';

import { UserAllCredentialsList, UserFavoriteList } from '../../UserCredentials/UserCredentialsList';

import { ProfileWidget } from './ProfileWidget';

export function CredentialsWidget({
  credentials,
  setActiveTab
}: {
  setActiveTab?: Dispatch<SetStateAction<number>>;
  credentials: EASAttestationWithFavorite[];
}) {
  const favoriteCredentials = credentials
    ?.filter((credential) => credential.favoriteCredentialId)
    .slice(0, 5)
    .sort((a, b) => (a.index || 0) - (b.index || 0));
  const nonFavoriteCredentials = credentials
    ?.filter((credential) => !credential.favoriteCredentialId)
    .slice(0, 5 - favoriteCredentials.length);

  return (
    <ProfileWidget title='Credentials' avatarComponent={<MedalIcon />}>
      <Stack gap={1}>
        <UserFavoriteList smallScreen readOnly credentials={favoriteCredentials} />
        <UserAllCredentialsList smallScreen readOnly credentials={nonFavoriteCredentials} />
        {credentials.length > 5 && setActiveTab && (
          <Button
            variant='text'
            color='primary'
            size='small'
            sx={{
              mt: 1,
              width: 'fit-content',
              fontWeight: 'bold'
            }}
            onClick={() => {
              setActiveTab(2);
            }}
          >
            View All Credentials
          </Button>
        )}
      </Stack>
    </ProfileWidget>
  );
}
