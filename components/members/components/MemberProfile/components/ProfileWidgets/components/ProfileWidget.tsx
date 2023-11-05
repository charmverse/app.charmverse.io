import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Avatar, Card, CardContent, Divider, Stack, Typography } from '@mui/material';

import Link from 'components/common/Link';

export function ProfileWidget({
  children,
  avatarVariant = 'rounded',
  avatarComponent,
  avatarSrc,
  link,
  linkComponent,
  title
}: {
  avatarVariant?: 'rounded' | 'square';
  avatarComponent?: React.ReactNode;
  avatarSrc?: string;
  children: React.ReactNode;
  link?: string | null;
  linkComponent?: React.ReactNode;
  title: string;
}) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction='row' justifyContent='space-between' alignItems='center' px={2} pt={1}>
        <Stack spacing={1} direction='row' alignItems='center'>
          {avatarComponent}
          {avatarSrc && <Avatar variant={avatarVariant} src={avatarSrc} sx={{ width: 24, height: 24 }} />}
          <Typography variant='h6' fontWeight={700}>
            {title}
          </Typography>
        </Stack>
        <Stack direction='row' spacing={1} alignItems='flex-start'>
          {linkComponent}
          {link && (
            <Link
              color='secondarys'
              href={link}
              target='_blank'
              sx={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <OpenInNewIcon fontSize='small' />
            </Link>
          )}
        </Stack>
      </Stack>
      <CardContent
        sx={{
          pt: 1,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column'
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
