import { Divider, Grid, Stack } from '@mui/material';
import useSWRImmutable from 'swr/immutable';
import charmClient from 'charmClient';
import UserDetails, { isPublicUser, UserDetailsProps } from './components/UserDetails';
import PoapSection from './components/PoapSection';
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
      <Grid container direction='row' rowSpacing={3}>
        <Grid item xs={12} md={6} mr={1}>
          <DeepDaoData user={props.user} poapData={poapData} />
        </Grid>
        <Grid item xs={12} md={5.75}>
          <PoapSection user={props.user} mutatePoaps={mutatePoaps} poapData={poapData} />
        </Grid>
      </Grid>
    </Stack>
  );
}
