import { Divider, Stack } from '@mui/material';
import { UserDetails } from './components';

export default function PublicProfile () {

  return (
    <Stack spacing={2}>
      <UserDetails />
      <Divider />
    </Stack>
  );
}
