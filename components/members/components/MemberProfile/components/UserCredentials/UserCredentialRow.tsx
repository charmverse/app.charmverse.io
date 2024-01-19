import LaunchIcon from '@mui/icons-material/Launch';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Icon from '@mui/material/Icon';
import Image from 'next/image';

import Link from 'components/common/Link';
import type { PublishedSignedCredential } from 'lib/credentials/queriesAndMutations';

export function UserCredentialRow({ credential }: { credential: PublishedSignedCredential }) {
  return (
    <Box display='flex' alignItems='center' justifyContent='space-between'>
      <Box ml={2} display='flex' alignItems='center' gap={2}>
        <Image src='/images/logo_black_transparent.64.png' alt='charmverse-logo' height={30} width={30} />
        <Box display='flex' flexDirection='column'>
          <Typography variant='body1' fontWeight='bold'>
            {credential.content.name}
          </Typography>
          <Typography variant='caption' fontWeight='bold'>
            {credential.content.organization}
          </Typography>
        </Box>
      </Box>
      <Link href={credential.verificationUrl} external target='_blank'>
        <LaunchIcon sx={{ alignSelf: 'center' }} />
      </Link>
    </Box>
  );
}
