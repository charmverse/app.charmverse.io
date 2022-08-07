import { Box, Card, Divider, Grid, Stack, Typography } from '@mui/material';
import UserDetails, { UserDetailsProps } from './components/UserDetails';
import PoapSection from './components/PoapSection';
import AggregatedData from './components/AggregatedData';
import CollablandCredentials from './components/CollablandCredentials/CollablandCredentials';

export default function PublicProfile (props: UserDetailsProps) {
  return (
    <Stack spacing={2}>
      <UserDetails {...props} />
      <Divider />
      <div>
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Stack spacing={2}>
              <AggregatedData user={props.user} />
              <Card>
                <Box p={2} pb={0}>
                  <Typography fontWeight={700} fontSize={20}>Credentials</Typography>
                </Box>
                <CollablandCredentials />
              </Card>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <PoapSection user={props.user} />
          </Grid>
        </Grid>
      </div>
    </Stack>
  );
}
