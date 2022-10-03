import { Box, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import Button from 'components/common/Button';
import Link from 'components/common/Link';
import collablandLogo from 'public/images/collabland_logo.jpeg';

import { useCollablandCredentials } from '../../hooks/useCollablandCredentials';

export default function CollablandCredentials ({ error }: { error?: any }) {

  const { getCollablandLogin } = useCollablandCredentials();
  const connectUrl = getCollablandLogin();

  return (
    <Stack mt={6} alignItems='center' spacing={1}>
      <Authorize connectUrl={connectUrl} />
      {error && (
        <Typography variant='body2' color='error'>
          There was an error. Please try again
        </Typography>
      )}
    </Stack>
  );
}

function Authorize ({ connectUrl }: { connectUrl: string }) {
  return (
    <>
      <Box width={100} maxWidth='100%'>
        <Image src={collablandLogo} />
      </Box>
      <Typography variant='body2' fontWeight='strong'>
        Import credentials from <strong><Link color='inherit' external target='_blank' href='https://collab.land/'>Collab.land</Link></strong>
      </Typography>
      <Button href={connectUrl} external variant='outlined'>
        Connect
      </Button>
    </>
  );
}
