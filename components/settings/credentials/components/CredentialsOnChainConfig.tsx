import type { Space } from '@charmverse/core/prisma';
import { Box, FormControlLabel, Grid, Stack, Switch, TextField } from '@mui/material';
import { easSchemaChains, easSchemaMainnetChains } from '@packages/credentials/connectors';
import { isAddress } from 'viem';

import { InputSearchBlockchain } from 'components/common/form/InputSearchBlockchain';
import { Typography } from 'components/common/Typography';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';

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

  // Enable testnets for test space
  const showTestnets = useIsCharmverseSpace();

  return (
    <Grid container display='flex' justifyContent='flex-start' alignItems='center' gap={2}>
      <Grid item>
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
          <Grid item xs={4} style={{ minHeight: '72px' }}>
            {/* Added a minimum height */}
            <InputSearchBlockchain
              chains={showTestnets ? [...easSchemaChains] : [...easSchemaMainnetChains.map((c) => c.id)]}
              chainId={credentialsChainId as number}
              onChange={(chainId) => onChange({ credentialsChainId: chainId })}
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={6} px={2}>
            <Stack style={{ minHeight: '72px' }}>
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
