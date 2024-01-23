import LaunchIcon from '@mui/icons-material/Launch';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Image from 'next/image';

import Link from 'components/common/Link';
import { useGetEnsName } from 'hooks/useGetEnsName';
import type { EASAttestationFromApi } from 'lib/credentials/external/getExternalCredentials';
import { trackedSchemas } from 'lib/credentials/external/schemas';
import { shortWalletAddress } from 'lib/utilities/blockchain';

export function UserCredentialRow({ credential }: { credential: EASAttestationFromApi }) {
  const logo = credential.type === 'internal' ? '/images/logo_black_transparent.64.png' : '/images/logos/eas.png';

  const { ensname } = useGetEnsName({ address: credential.attester });

  const title =
    credential.type === 'internal'
      ? credential.content.name
      : trackedSchemas[credential.chainId].find((s) => s.schemaId === credential.schemaId)?.title;

  const subtitle =
    credential.type === 'internal'
      ? credential.content.organization
      : ensname ?? shortWalletAddress(credential.attester);

  return (
    <Box display='flex' alignItems='center' justifyContent='space-between'>
      <Box ml={2} display='flex' alignItems='center' gap={2}>
        <Image src={logo} alt='charmverse-logo' height={30} width={30} />
        <Box display='flex' flexDirection='column'>
          <Typography variant='body1' fontWeight='bold'>
            {title}
          </Typography>
          <Typography variant='caption' fontWeight='bold'>
            {subtitle}
          </Typography>
        </Box>
      </Box>
      <Link href={credential.verificationUrl} external target='_blank'>
        <LaunchIcon sx={{ alignSelf: 'center' }} />
      </Link>
    </Box>
  );
}
