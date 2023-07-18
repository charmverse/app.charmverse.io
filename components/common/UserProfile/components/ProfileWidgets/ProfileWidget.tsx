import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Avatar, Card, CardContent, Divider, Stack, Typography } from '@mui/material';

import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';

export function ProfileWidget({
  title,
  children,
  avatarSrc,
  link,
  avatarVariant = 'rounded',
  isLoading,
  emptyContent
}: {
  isLoading?: boolean;
  avatarVariant?: 'rounded' | 'square';
  avatarSrc?: string;
  title: string;
  children: React.ReactNode;
  link?: string | null;
  emptyContent?: string | null;
}) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction='row' justifyContent='space-between' alignItems='center' px={2} pt={1}>
        <Stack spacing={1} direction='row' alignItems='center'>
          {avatarSrc && <Avatar variant={avatarVariant} src={avatarSrc} sx={{ width: 24, height: 24 }} />}
          <Typography variant='h6' fontWeight={700}>
            {title}
          </Typography>
        </Stack>
        <Stack direction='row' spacing={1} alignItems='center'>
          {link && (
            <Link
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
        {isLoading ? <LoadingComponent size={32} isLoading /> : children}
        {!isLoading && emptyContent && (
          <Card variant='outlined' sx={{ flexGrow: 1 }}>
            <Stack
              p={3}
              textAlign='center'
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}
            >
              <CancelOutlinedIcon fontSize='large' color='secondary' />
              <Typography color='secondary'>{emptyContent}</Typography>
            </Stack>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
