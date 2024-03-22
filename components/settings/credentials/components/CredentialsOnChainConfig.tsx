import type { Space } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, FormControlLabel, Grid, Input, Stack, Switch, TextField } from '@mui/material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { isAddress } from 'viem';
import { optimism, optimismSepolia } from 'viem/chains';
import type * as yup from 'yup';

import FieldLabel from 'components/common/form/FieldLabel';
import { InputSearchBlockchain } from 'components/common/form/InputSearchBlockchain';
import { Typography } from 'components/common/Typography';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { easSchemaChains } from 'lib/credentials/connectors';

export type UpdateableCredentialProps = Pick<
  Space,
  'credentialsChainId' | 'credentialsWallet' | 'useOnchainCredentials'
>;

type Props = {
  onChange: (data: Partial<UpdateableCredentialProps>) => void;
  readOnly: boolean;
} & Partial<Pick<Space, 'useOnchainCredentials' | 'credentialsChainId' | 'credentialsWallet'>>;

export function CredentialsOnChainConfig({
  onChange,
  readOnly,
  credentialsChainId,
  credentialsWallet,
  useOnchainCredentials
}: Props) {
  const validAddress = !credentialsWallet || isAddress(credentialsWallet);

  return (
    <Grid container display='flex' justifyContent='flex-start' alignItems='center' gap={2}>
      <Grid item>
        <Box></Box>
        <FormControlLabel
          sx={{
            margin: 0,
            display: 'flex',
            justifyContent: 'flex-start'
          }}
          control={
            <Box display='flex' gap={2} alignItems='center'>
              <Switch
                checked={!!useOnchainCredentials}
                onChange={(ev) => onChange({ useOnchainCredentials: ev.target.checked })}
                disabled={readOnly}
              />
            </Box>
          }
          label={<Typography sx={{ minWidth: '100px' }}>Issue onchain credentials</Typography>}
          labelPlacement='end'
        />
        <Typography>
          {' '}
          Issue credentials onchain with EAS attestations signed by an authorative wallet for your space
        </Typography>
      </Grid>

      {useOnchainCredentials && (
        <Grid container item justifyContent='flex-start' alignItems='flex-start'>
          {' '}
          {/* Changed alignItems to 'flex-start' to align items to the top */}
          <Grid item xs={4} style={{ minHeight: '72px' }}>
            {' '}
            {/* Added a minimum height */}
            <InputSearchBlockchain
              chains={[...easSchemaChains]}
              chainId={credentialsChainId as number}
              onChange={(chainId) => onChange({ credentialsChainId: chainId })}
            />
          </Grid>
          <Grid item xs={6} px={2}>
            <Stack style={{ minHeight: '72px' }}>
              {' '}
              {/* Added a minimum height */}
              <TextField
                value={credentialsWallet}
                onChange={(ev) => {
                  const value = ev.target.value;
                  if (!value) {
                    onChange({ credentialsWallet: null });
                  } else {
                    onChange({ credentialsWallet: ev.target.value });
                  }
                }}
                error={!validAddress}
                helperText={!validAddress ? 'Please enter a valid address' : ' '}
                placeholder='Wallet or Gnosis Safe address'
                disabled={readOnly}
                fullWidth
              />
            </Stack>
          </Grid>
        </Grid>
      )}

      {/* <Typography>{credentialDescriptionMap[credentialEvent]?.(getFeatureTitle)}</Typography> */}
    </Grid>
  );
}
