
import { Box, Card, Divider, Stack, Typography } from '@mui/material';
import charmClient from 'charmClient';
import useSWRImmutable from 'swr/immutable';
import { GetPoapsResponse } from 'lib/poap';
import AggregatedData from './components/AggregatedData';
import CollablandCredentials from './components/CollablandCredentials/CollablandCredentials';
import UserDetails, { isPublicUser, UserDetailsProps } from './components/UserDetails';
import UserCollectives from './components/UserCollectives';

export default function PublicProfile (props: UserDetailsProps) {
  const isPublic = isPublicUser(props.user);
  const { data: poapData, mutate: mutatePoaps } = useSWRImmutable(`/poaps/${props.user.id}/${isPublic}`, () => {
    return isPublicUser(props.user)
      ? Promise.resolve({ visiblePoaps: props.user.visiblePoaps, hiddenPoaps: [] } as GetPoapsResponse)
      : charmClient.getUserPoaps();
  });

  return (
    <Stack spacing={2}>
      <UserDetails {...props} />
      <Divider />
      <AggregatedData user={props.user} />
      <UserCollectives user={props.user} mutatePoaps={mutatePoaps} poapData={poapData} />
      <Card>
        <Box p={2} pb={0}>
          <Typography fontWeight={700} fontSize={20}>Credentials</Typography>
        </Box>
        <CollablandCredentials />
      </Card>
    </Stack>
  );
}
