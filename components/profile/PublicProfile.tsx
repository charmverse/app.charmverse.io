import { Divider, Stack } from '@mui/material';
import charmClient from 'charmClient';
import useSWRImmutable from 'swr/immutable';
import { DeepDaoData } from './components/DeepDaoData';
import UserDetails, { isPublicUser, UserDetailsProps } from './components/UserDetails';
import UserPoaps from './components/UserPoaps';

export default function PublicProfile (props: UserDetailsProps) {
  const isPublic = isPublicUser(props.user);
  const { data: poapData, mutate: mutatePoaps } = useSWRImmutable(`/poaps/${props.user.id}/${isPublic}`, () => {
    return isPublicUser(props.user) ? Promise.resolve({ visiblePoaps: props.user.visiblePoaps, hiddenPoaps: [] }) : charmClient.getUserPoaps();
  });

  return (
    <Stack spacing={2}>
      <UserDetails {...props} />
      <Divider />
      <DeepDaoData user={props.user} />
      <UserPoaps user={props.user} mutatePoaps={mutatePoaps} poapData={poapData} />
    </Stack>
  );
}
