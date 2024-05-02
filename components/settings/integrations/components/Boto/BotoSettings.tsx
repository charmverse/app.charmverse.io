import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import Link from 'components/common/Link';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import { IntegrationContainer } from '../IntegrationContainer';

export function BotoSettings({ isAdmin }: { isAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { getFeatureTitle } = useSpaceFeatures();
  return (
    <IntegrationContainer
      title='Boto'
      subheader='Send events to Discord or Telegram'
      expanded={expanded}
      setExpanded={setExpanded}
      isAdmin={isAdmin}
      isConnected={false}
    >
      <Stack gap={2}>
        <Typography variant='body2'>
          Connect your space to Discord or Telegram via Boto to receive notifications about{' '}
          {getFeatureTitle('Proposals')}.
        </Typography>
        <Typography variant='body2'>
          You will need to request an <Link href='/api-docs'>API Key</Link> to use Boto.
        </Typography>
        <div>
          <Button endIcon={<LaunchIcon fontSize='small' />} href='https://boto.io/integrations/charmverse' external>
            Visit Boto
          </Button>
        </div>
      </Stack>
    </IntegrationContainer>
  );
}
