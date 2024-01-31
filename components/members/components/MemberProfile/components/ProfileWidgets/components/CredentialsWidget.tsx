import MedalIcon from '@mui/icons-material/WorkspacePremium';
import type { Dispatch, SetStateAction } from 'react';

import { Button } from 'components/common/Button';
import type { EASAttestationWithFavorite } from 'lib/credentials/external/getExternalCredentials';

import { UserAllCredentialsList, UserFavoriteList } from '../../UserCredentials/UserCredentialsList';

import { ProfileWidget } from './ProfileWidget';

export function CredentialsWidget({
  credentials,
  setActiveTab
}: {
  setActiveTab?: Dispatch<SetStateAction<number>>;
  credentials: EASAttestationWithFavorite[];
}) {
  const favoriteCredentials = credentials?.filter((credential) => credential.favorite).slice(0, 5);
  const nonFavoriteCredentials = credentials
    ?.filter((credential) => !credential.favorite)
    .slice(0, 5 - favoriteCredentials.length);

  return (
    <ProfileWidget title='Credentials' avatarComponent={<MedalIcon />}>
      {favoriteCredentials.length !== 0 && <UserFavoriteList hideTitle credentials={favoriteCredentials} />}
      <UserAllCredentialsList hideTitle credentials={nonFavoriteCredentials} />
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
    </ProfileWidget>
  );
}
