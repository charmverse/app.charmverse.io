import LaunchIcon from '@mui/icons-material/Launch';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

export type UserCredentialRowProps = {
  credential: { title: string; subtitle: string };
  isSmallScreen?: boolean;
  verificationUrl?: string | null;
};

export function CredentialRow({ credential, isSmallScreen, verificationUrl }: UserCredentialRowProps) {
  const { space } = useCurrentSpace();

  const credentialInfo = {
    title: credential.title,
    subtitle: credential.subtitle,
    iconUrl: space?.credentialLogo || '/images/logo_black_lightgrey.png'
  };

  return (
    <Stack gap={1} alignItems='center' justifyContent='space-between' flexDirection='row'>
      <Box gap={1} display='flex' alignItems='center' justifyItems='flex-start' flexBasis='100%' sx={{ pr: 1 }}>
        <Image
          src={credentialInfo.iconUrl}
          alt='charmverse-logo'
          height={isSmallScreen ? 40 : 30}
          width={isSmallScreen ? 40 : 30}
        />
        <Box display='flex' flexDirection='column' flexGrow={2}>
          <Typography variant='body1' fontWeight='bold'>
            {credentialInfo.title}
          </Typography>
          <Typography variant='caption'>{credentialInfo.subtitle}</Typography>
        </Box>
      </Box>
      {verificationUrl && (
        <Button
          external
          href={verificationUrl}
          target='_blank'
          variant='outlined'
          color='secondary'
          size='small'
          endIcon={<LaunchIcon />}
        >
          View
        </Button>
      )}
    </Stack>
  );
}
