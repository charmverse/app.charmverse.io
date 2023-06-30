import { Avatar, Card, CardContent, Divider, Stack, Typography } from '@mui/material';

export function ProfileWidget({
  title,
  children,
  avatarSrc
}: {
  avatarSrc?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <Stack spacing={1} direction='row' alignItems='center' px={2} pt={1}>
        {avatarSrc && <Avatar variant='rounded' src={avatarSrc} sx={{ width: 24, height: 24 }} />}
        <Typography variant='h6' fontWeight={700}>
          {title}
        </Typography>
      </Stack>
      <CardContent
        sx={{
          pt: 1
        }}
      >
        <Divider
          sx={{
            mb: 1
          }}
        />
        {children}
      </CardContent>
    </Card>
  );
}
