import { Box, Typography } from '@mui/material';
import _isEqual from 'lodash/isEqual';
import { useState } from 'react';

import { useUpdateSpace } from 'charmClient/hooks/spaces';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import type { UpdateableSpaceFields } from 'lib/spaces/updateSpace';

import Legend from '../Legend';
import Avatar from '../space/components/LargeAvatar';

import type { UpdateableCredentialProps } from './components/CredentialsOnChainConfig';
import { CredentialsOnChainConfig } from './components/CredentialsOnChainConfig';
import { CredentialTemplates } from './components/CredentialTemplates';

export function SpaceCredentialSettings() {
  const { space, refreshCurrentSpace } = useCurrentSpace();
  useTrackPageView({ type: 'settings/credentials' });
  const isAdmin = useIsAdmin();
  const [credentialLogo, setCredentialLogo] = useState(space?.credentialLogo ?? '');
  const { trigger, isMutating } = useUpdateSpace(space?.id);

  const [spaceOnChainCredentialSettings, setSpaceOnChainCredentialSettings] =
    useState<UpdateableCredentialProps | null>(null);

  const disableSaveButton =
    isMutating ||
    (credentialLogo === (space?.credentialLogo ?? '') &&
      (!spaceOnChainCredentialSettings ||
        _isEqual(spaceOnChainCredentialSettings, {
          useOnchainCredentials: space?.useOnchainCredentials,
          credentialsChainId: space?.credentialsChainId,
          credentialsWallet: space?.credentialsWallet
        })));

  return (
    <>
      <Legend>Credentials</Legend>
      <Typography variant='h6'>Credentials (EAS Attestations)</Typography>

      <Box mb={2}>
        <CredentialTemplates />
      </Box>

      <Typography variant='h6'>Credentials Logo</Typography>
      <Box display='flex' flexDirection='column' alignItems='left' mb={2}>
        <Typography variant='body1'>Select a custom logo which will appear on Credentials in CharmVerse</Typography>
      </Box>
      <Box mb={1}>
        <Avatar
          name={space?.name ?? ''}
          variant='rounded'
          image={(credentialLogo ?? space?.spaceArtwork) || '/images/logo_black_lightgrey.png'}
          updateImage={(url: string) => {
            setCredentialLogo(url);
          }}
          editable={isAdmin && !isMutating}
          hideDelete={isMutating || credentialLogo === ''}
        />
      </Box>
      <Typography variant='h6'>Onchain Credentials</Typography>
      <Box display='flex' flexDirection='column' alignItems='left' mb={2}>
        <CredentialsOnChainConfig readOnly={!isAdmin} onChange={setSpaceOnChainCredentialSettings} />
      </Box>
      {isAdmin && (
        <Button
          sx={{
            width: 'fit-content'
          }}
          disableElevation
          size='large'
          disabled={disableSaveButton}
          onClick={() => {
            const update: UpdateableSpaceFields = {};
            if (credentialLogo !== space?.credentialLogo) {
              update.credentialLogo = credentialLogo;
            }
            if (spaceOnChainCredentialSettings) {
              update.useOnchainCredentials = spaceOnChainCredentialSettings.useOnchainCredentials;
              update.credentialsChainId = spaceOnChainCredentialSettings.credentialsChainId;
              update.credentialsWallet = spaceOnChainCredentialSettings.credentialsWallet;
            }
            trigger(update).then(() => refreshCurrentSpace());
          }}
          loading={isMutating}
        >
          Save
        </Button>
      )}
    </>
  );
}
