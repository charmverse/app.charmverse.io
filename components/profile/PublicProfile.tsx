import { Divider, Stack } from '@mui/material';
import charmClient from 'charmClient';
import useSWRImmutable from 'swr/immutable';
import { GetPoapsResponse } from 'lib/poap';
import AggregatedData from './components/AggregatedData';
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
    </Stack>
  );
}
