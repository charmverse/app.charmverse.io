import { Box, Stack, Typography } from '@mui/material';

export function ErrorWrapper({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <Stack flex={1}>
      <Stack
        sx={{
          boxShadow: error ? '0 0 0 1px var(--danger-text)' : 'none',
          borderRadius: ({ spacing }) => spacing(0.5)
        }}
      >
        {children}
      </Stack>
      {!!error && (
        <Typography variant='caption' color='var(--danger-text)' ml={1} mt='2px'>
          {error}
        </Typography>
      )}
    </Stack>
  );
}
