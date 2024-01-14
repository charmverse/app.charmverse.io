import type { Space } from '@charmverse/core/prisma';
import { Box, Divider, Tooltip, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';

import {
  useGetProposalWorkflows,
  useUpsertProposalWorkflow,
  useDeleteProposalWorkflow
} from 'charmClient/hooks/spaces';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import Legend from '../Legend';

import { CredentialEventsForm } from './components/CredentialEventsForm';
import { CredentialTemplateDialog } from './components/CredentialTemplateDialog';
import { CredentialTemplates } from './components/CredentialTemplates';
import { useGetCredentialTemplates } from './hooks/credentialHooks';

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
