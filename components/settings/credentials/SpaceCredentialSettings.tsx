import type { Space } from '@charmverse/core/prisma';
import { Box, Typography } from '@mui/material';

import { useTrackPageView } from 'charmClient/hooks/track';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import Legend from '../Legend';

import { CredentialEventsForm } from './components/CredentialEventsForm';
import { CredentialTemplates } from './components/CredentialTemplates';

export function SpaceCredentialSettings({ space }: { space: Space }) {
  const { getFeatureTitle } = useSpaceFeatures();

  useTrackPageView({ type: 'settings/credentials' });

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
      <Typography variant='h6'>Proposals</Typography>
      <CredentialEventsForm />

      {/** Modal */}
    </>
  );
}
