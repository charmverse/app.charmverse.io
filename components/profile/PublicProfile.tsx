import { Divider, Stack } from '@mui/material';
import AggregatedData from './components/AggregatedData';
import UserDetails, { UserDetailsProps } from './components/UserDetails';
import UserCollectives from './components/UserCollectives';

export default function PublicProfile (props: UserDetailsProps) {
  return (
    <Stack spacing={2}>
      <UserDetails {...props} />
      <Divider />
      <AggregatedData user={props.user} />
      <UserCollectives user={props.user} />
    </Stack>
  );
}
