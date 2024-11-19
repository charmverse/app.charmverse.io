import { Stack, Link as MuiLink } from '@mui/material';

export function InfoPageFooter() {
  return (
    <Stack justifyContent='center' gap={2} flexDirection='row'>
      <MuiLink href='/info/privacy-policy'>Privacy Policy</MuiLink>
      <MuiLink href='/info/terms'>Terms</MuiLink>
      <MuiLink href='/info/dpa'>DPA</MuiLink>
    </Stack>
  );
}
