import type { KycOption, Space } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useGetKycCredentials, useUpdateKycCredentials } from 'charmClient/hooks/kyc';
import { useUpdateSpace } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import { useDocusign } from 'components/signing/hooks/useDocusign';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { KycCredentials } from 'lib/kyc/getKycCredentials';

import { IntegrationContainer } from '../IntegrationContainer';

import { DocusignSettings } from './DocusignSettings';

export function DocumentSettings({ space, isAdmin }: { space: Space; isAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { docusignProfile, refreshDocusignProfile, disconnectDocusign, docusignOauthUrl } = useDocusign();

  const oauthUrl = docusignOauthUrl();

  return (
    <IntegrationContainer
      title='Documents'
      subheader='Connect Docusign to your account'
      expanded={expanded}
      setExpanded={setExpanded}
      isAdmin={isAdmin}
      isConnected={!!docusignProfile}
      onCancel={() => setExpanded(false)}
    >
      <Box>
        <Stack direction='row' spacing={2}>
          {docusignProfile ? (
            <Button onClick={disconnectDocusign} color='error' variant='outlined'>
              Disconnect
            </Button>
          ) : (
            <Button href={oauthUrl} external color='primary'>
              Connect Docusign
            </Button>
          )}
        </Stack>
      </Box>
    </IntegrationContainer>
  );
}
