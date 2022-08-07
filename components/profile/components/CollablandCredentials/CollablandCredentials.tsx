import { Typography, Box, Stack } from '@mui/material';
import Avatar from 'components/common/Avatar';
import Button from 'components/common/Button';
import { useRouter } from 'next/router';
import useSWRImmutable from 'swr/immutable';
import charmClient from 'charmClient';
import type { CollablandCredential } from 'lib/collabland';
import LoadingComponent from 'components/common/LoadingComponent';
import { toMonthDate } from 'lib/utilities/dates';

export default function CollablandCredentials () {

  const router = useRouter();
  const aeToken = typeof router.query.aeToken === 'string' ? router.query.aeToken : router.query.aeToken?.[0];

  const { data: credentials, error } = useSWRImmutable(() => !!aeToken, () => charmClient.getCollablandCredentials(aeToken as string));

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
  if (aeToken) {
    if (!credentials) {
      return <LoadingComponent isLoading={true} />;
    }
    return <Credentials credentials={credentials} />;
  }
  return <Authorize />;
}

function Authorize () {

  const connectUrl = getCollablandLogin();

  return (
    <Stack my={3} alignItems='center' spacing={3}>
      <Typography fontWeight='strong'>
        Add credentials from Collab.land
      </Typography>
      <Button href={connectUrl} external variant='outlined'>
        Import credentials
      </Button>
    </Stack>
  );
}

function Credentials ({ credentials }: { credentials: CollablandCredential[] }) {
  return (
    <>
      {credentials.length === 0 && (
        <Box p={4} display='flex' justifyContent='center'>
          <Typography variant='body2' color='secondary'>
            You have no Collab.land credentials
          </Typography>
        </Box>
      )}
      {credentials.map((credential, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Box key={i} display='flex' justifyContent='center' my={2}>
          <Box px={2}>
            <Avatar size='xLarge' avatar={credential.discordGuildAvatar} />
          </Box>
          <Stack flexGrow={1} pr={2} justifyContent='center'>
            <Typography variant='body2'>
              {credential.discordGuildName}
            </Typography>
            <Typography variant='caption' color='secondary'>
              <strong>{credential.discordRoleName}</strong> issued on {toMonthDate(credential.createdAt)}
            </Typography>
          </Stack>
        </Box>
      ))}
      <Box display='flex' justifyContent='center' pb={2}>
        <Button size='small' variant='outlined' color='secondary' href={getCollablandLogin()} external>
          Refresh credentials
        </Button>
      </Box>
    </>
  );
}

function getCollablandLogin () {
  return `https://login-qa.collab.land?state=foobar&redirect_uri=${encodeURIComponent(window.location.href.split('?')[0])}`;
}
