import { Divider, Grid, Stack } from '@mui/material';
import { ExtendedPoap } from 'models';
import UserDetails, { UserDetailsProps } from './components/UserDetails';
import PoapSection from './components/PoapSection';

export default function PublicProfile (props: UserDetailsProps) {
  return (
    <Stack spacing={2}>
      <UserDetails {...props} />
      <Divider />
      <Grid container direction='row' rowSpacing={3}>
        <Grid item xs={12} md={7}>

        </Grid>
        <Grid item xs={12} md={5}>
          <PoapSection user={props.user} />
        </Grid>
      </Grid>
    </Stack>
  );
}
