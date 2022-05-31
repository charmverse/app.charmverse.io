import { Divider, Stack } from '@mui/material';
import UserDetails, { UserDetailsProps } from './components/UserDetails';

export default function PublicProfile (props: UserDetailsProps) {
  return (
    <Stack spacing={2}>
      <UserDetails {...props} />
      <Divider />
    </Stack>
  );
}
