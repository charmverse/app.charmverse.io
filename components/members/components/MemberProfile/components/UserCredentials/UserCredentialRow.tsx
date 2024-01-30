import LaunchIcon from '@mui/icons-material/Launch';
import { Chip, Grid, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Image from 'next/image';

import Link from 'components/common/Link';
import type { EASAttestationFromApi } from 'lib/credentials/external/getExternalCredentials';
import type { TrackedSchemaParams } from 'lib/credentials/external/schemas';
import { trackedSchemas } from 'lib/credentials/external/schemas';

export function UserCredentialRow({ credential }: { credential: EASAttestationFromApi }) {
  const schemaInfo = credential.chainId
    ? trackedSchemas[credential.chainId]?.find((s) => s.schemaId === credential.schemaId)
    : ({
        title: credential.content.title,
        organization: credential.content.organization,
        iconUrl: credential.iconUrl,
        fields: credential.content.fields ?? []
      } as TrackedSchemaParams);

  const credentialInfo: {
    title: string;
    subtitle: string;
    iconUrl: string;
    attestationContent: { name: string; value: string }[];
  } =
    credential.type === 'internal'
      ? {
          title: credential.content.name,
          subtitle: credential.content.organization,
          iconUrl: credential.iconUrl ?? '/images/logo_black_lightgrey.png',
          attestationContent: [{ name: 'status', value: credential.content.status }]
        }
      : {
          title: schemaInfo?.title ?? '',
          subtitle: schemaInfo?.organization ?? '',
          iconUrl: schemaInfo?.iconUrl ?? '',
          attestationContent: (schemaInfo?.fields ?? []).map((fieldDef) => ({
            name: fieldDef.name,
            value: fieldDef.mapper
              ? fieldDef.mapper(credential.content[fieldDef.name])
              : credential.content[fieldDef.name]
          }))
        };

  return (
    <Grid container display='flex' alignItems='center' justifyContent='space-between'>
      <Grid item xs={5}>
        <Box ml={2} display='flex' alignItems='center' gap={2}>
          <Image src={credentialInfo.iconUrl} alt='charmverse-logo' height={30} width={30} />
          <Box display='flex' flexDirection='column'>
            <Typography variant='body1' fontWeight='bold'>
              {credentialInfo.title}
            </Typography>
            <Typography variant='caption' fontWeight='bold'>
              {credentialInfo.subtitle}
            </Typography>
          </Box>
        </Box>
      </Grid>
      <Grid item display='flex' justifyContent='flex-start' xs={5} gap={1}>
        {credentialInfo.attestationContent.map((field) => (
          <Chip variant='outlined' key={field.name} label={field.value} />
        ))}
      </Grid>
      {credential.verificationUrl && (
        <Grid item xs={2} display='flex' justifyContent='flex-end' pr={2}>
          <Link href={credential.verificationUrl} external target='_blank'>
            <LaunchIcon sx={{ alignSelf: 'center' }} />
          </Link>
        </Grid>
      )}
    </Grid>
  );
}
