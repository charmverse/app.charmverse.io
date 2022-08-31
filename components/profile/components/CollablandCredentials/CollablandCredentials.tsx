import { Typography, Box, Stack } from '@mui/material';
import Button from 'components/common/Button';
import { useCollablandCredentials } from '../../hooks/useCollablandCredentials';

export default function CollablandCredentials ({ error }: { error?: any}) {
  if (error) {
    return (
      <Stack my={3} alignItems='center'>
        <Authorize />
        <Typography variant='body2' color='error'>
          There was an error. Please try again
        </Typography>
      </Stack>
    );
  }
  return <Authorize />;
}

function Authorize () {

  const { getCollablandLogin } = useCollablandCredentials();
  const connectUrl = getCollablandLogin();

  return (
    <Stack my={3} alignItems='center' spacing={3}>
      <Typography fontWeight='strong'>
        Authenticate with Collab.land to import credentials
      </Typography>
      <Button href={connectUrl} external variant='outlined'>
        Connect
      </Button>
    </Stack>
  );
}
