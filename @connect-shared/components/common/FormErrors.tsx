import { Typography } from '@mui/material';
import { Stack } from '@mui/system';

export function FormErrors({ errors }: { errors: string[] }) {
  return (
    <Stack display='flex' flexDirection='column' justifyContent='center'>
      {errors.map((error) => (
        <Typography alignContent='center' variant='caption' key={error} color='error'>
          {error}
        </Typography>
      ))}
    </Stack>
  );
}
