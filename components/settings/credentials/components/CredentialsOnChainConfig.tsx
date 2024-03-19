import type { Space } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, FormControlLabel, Grid, Input, Switch } from '@mui/material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { isAddress } from 'viem';
import { optimism, optimismSepolia } from 'viem/chains';
import * as yup from 'yup';

import { InputSearchBlockchain } from 'components/common/form/InputSearchBlockchain';
import { Typography } from 'components/common/Typography';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';

export type UpdateableCredentialProps = Pick<
  Space,
  'credentialsChainId' | 'credentialsWallet' | 'useOnchainCredentials'
>;

type Props = {
  onChange: (data: UpdateableCredentialProps) => void;
  readOnly: boolean;
};

const schema = yup.object({
  useOnchainCredentials: yup.boolean().required(),
  credentialsChainId: yup.number().required().nullable(),
  credentialsWallet: yup
    .string()
    .required()
    .nullable()
    .test((value: any) => !value || isAddress(value))
});

type FormValues = yup.InferType<typeof schema>;

export function CredentialsOnChainConfig({ onChange, readOnly }: Props) {
  const isAdmin = useIsAdmin();
  const { space } = useCurrentSpace();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
    setValue,
    watch
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      useOnchainCredentials: !!space?.useOnchainCredentials ?? false,
      credentialsChainId: space?.credentialsChainId ?? optimism.id,
      credentialsWallet: space?.credentialsWallet ?? null
    },
    resolver: yupResolver(schema)
  });

  const values = watch();

  const isValidForm =
    isValid &&
    (!values.credentialsChainId ||
      (values.credentialsChainId && values.credentialsChainId && values.credentialsWallet));

  useEffect(() => {
    if (isValidForm) {
      onChange(values);
    }
  }, [watch, values.credentialsWallet, values.credentialsChainId, values.useOnchainCredentials]);

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
                value={values.useOnchainCredentials}
                defaultChecked={values.useOnchainCredentials}
                onChange={(ev) => setValue('useOnchainCredentials', ev.target.checked)}
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

      {values.useOnchainCredentials && (
        <Grid container item justifyContent='flex-start' alignItems='center'>
          <Grid item xs={3}>
            <InputSearchBlockchain
              chains={[optimism.id, optimismSepolia.id]}
              chainId={values.credentialsChainId as number}
              onChange={(chainId) => setValue('credentialsChainId', chainId)}
            />
          </Grid>
          <Grid item xs={6} px={2}>
            <Input
              {...register('credentialsWallet')}
              autoFocus
              placeholder='Enter wallet address which will sign credentials'
              type='text'
              fullWidth
              disabled={readOnly}
              sx={{
                '.Mui-disabled': {
                  color: 'var(--text-primary) !important',
                  WebkitTextFillColor: 'var(--text-primary) !important'
                }
              }}
            />
          </Grid>
        </Grid>
      )}

      {/* <Typography>{credentialDescriptionMap[credentialEvent]?.(getFeatureTitle)}</Typography> */}
    </Grid>
  );
}
