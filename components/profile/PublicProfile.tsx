import { Divider, Grid, Stack } from '@mui/material';
import UserDetails, { UserDetailsProps } from './components/UserDetails';
import PoapSection from './components/PoapSection';
import { AggregatedData } from './components/AggregatedData';

export default function PublicProfile (props: UserDetailsProps) {
  return (
    <Stack spacing={2}>
      <UserDetails {...props} />
      <Divider />
      <Grid container direction='row' rowSpacing={3}>
        <Grid item xs={12} md={7}>
          <AggregatedData user={props.user} />
        </Grid>
        <Grid item xs={12} md={5}>
          <PoapSection user={props.user} />
        </Grid>
      </Grid>
    </Stack>
  );
}
