import { Divider, Grid, Stack } from '@mui/material';
import useSWRImmutable from 'swr/immutable';
import charmClient from 'charmClient';
import UserDetails, { isPublicUser, UserDetailsProps } from './components/UserDetails';
import { DeepDaoData } from './components/DeepDaoData';

export default function PublicProfile (props: UserDetailsProps) {
  const isPublic = isPublicUser(props.user);
  const { data: poapData, mutate: mutatePoaps } = useSWRImmutable(`/poaps/${props.user.id}/${isPublic}`, () => {
    return isPublicUser(props.user) ? Promise.resolve({ visiblePoaps: props.user.visiblePoaps, hiddenPoaps: [] }) : charmClient.getUserPoaps();
  });

  return (
    <Stack spacing={2}>
      <UserDetails {...props} />
      <Divider />
      <DeepDaoData user={props.user} poapData={poapData} mutatePoaps={mutatePoaps} />
    </Stack>
  );
}
