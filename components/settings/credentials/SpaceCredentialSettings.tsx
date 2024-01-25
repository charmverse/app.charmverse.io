import { Box, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import { useUpdateSpace } from 'charmClient/hooks/spaces';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import Legend from '../Legend';
import Avatar from '../space/components/LargeAvatar';

import { CredentialTemplates } from './components/CredentialTemplates';

export function SpaceCredentialSettings() {
  const { getFeatureTitle } = useSpaceFeatures();
  const { space } = useCurrentSpace();
  useTrackPageView({ type: 'settings/credentials' });
  const isAdmin = useIsAdmin();
  const [credentialLogo, setCredentialLogo] = useState<string>(
    space?.credentialLogo ?? space?.spaceArtwork ?? '/images/logo_black_lightgrey.png'
  );
  const [credentialLogoChanged, setCredentialLogoChanged] = useState(false);
  const { trigger, isMutating } = useUpdateSpace(space?.id);

  return (
    <>
      <Legend>Credentials</Legend>
      <Typography variant='h6'>Credentials (EAS Attestations)</Typography>
      <Box display='flex' flexDirection='column' alignItems='left' mb={2}>
        <Typography variant='body1'>
          Create credentials with EAS attestations to be awarded during the {getFeatureTitle('Proposals').toLowerCase()}{' '}
          process
        </Typography>
      </Box>

      <Box mb={2}>
        <CredentialTemplates />
      </Box>

      <Typography variant='h6'>Credentials Logo</Typography>
      <Box display='flex' flexDirection='column' alignItems='left' mb={2}>
        <Typography variant='body1'>Create a logo which will appear on Credentials in CharmVerse</Typography>
      </Box>
      <Box mb={2}>
        <Avatar
          name={space?.name ?? ''}
          variant='rounded'
          image={credentialLogo}
          updateImage={(url: string) => {
            setCredentialLogo(url);
            setCredentialLogoChanged(true);
          }}
          editable={isAdmin && !isMutating}
          hideDelete={!!space?.credentialLogo}
        />
      </Box>
      {isAdmin && (
        <Button
          sx={{
            width: 'fit-content'
          }}
          disableElevation
          size='large'
          disabled={isMutating || !credentialLogoChanged}
          onClick={async () => {
            await trigger({ credentialLogo });
            setCredentialLogoChanged(false);
          }}
          loading={isMutating}
        >
          Save
        </Button>
      )}
    </>
  );
}
