import type { PaymentMethod } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Progress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import type { ISystemError } from '@packages/utils/errors';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { FormError } from 'components/common/form/FormError.class';
import { InputSearchBlockchain } from 'components/common/form/InputSearchBlockchain';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import type { SupportedChainId } from '@packages/lib/blockchain/provider/alchemy/config';
import type { ITokenMetadataRequest } from '@packages/lib/tokens/tokenData';
import { isValidChainAddress } from '@packages/lib/tokens/validation';

export type FormMode = 'create' | 'update';

interface Props {
  onSubmit: (paymentMethod: PaymentMethod) => void;
  defaultChainId?: number;
}

export const schema = yup.object({
  chainId: yup.number().required('Please select a chain'),
  contractAddress: yup.string().test('verifyContractFormat', 'Invalid contract address', (value) => {
    return !value || isValidChainAddress(value);
  }),
  tokenSymbol: yup.string().nullable(),
  tokenName: yup.string().nullable(),
  tokenLogo: yup.string().nullable(),
  tokenDecimals: yup.number().nullable()
});

type FormValues = yup.InferType<typeof schema>;

export default function PaymentForm({ onSubmit, defaultChainId = 1 }: Props) {
  const [loadingToken, setLoadingToken] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isValid, isSubmitting }
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      // TBC till we agree on Prisma migration
      chainId: defaultChainId,
      // Default for an ERC20 token
      tokenDecimals: 18
    },
    resolver: yupResolver(schema)
  });

  const [, refreshPaymentMethods] = usePaymentMethods();
  const { space } = useCurrentSpace();

  const [allowManualInput, setAllowManualInput] = useState(false);
  const [formError, setFormError] = useState<ISystemError | null>(null);
  // Checks if we could load the logo
  const [logoLoadSuccess, setLogoLoadSuccess] = useState(false);

  const values = watch();

  useEffect(() => {
    const newContractAddress = watch(({ contractAddress, chainId }, { name }) => {
      if ((name === 'contractAddress' || name === 'chainId') && isValidChainAddress(contractAddress as string)) {
        loadToken({ chainId: chainId as SupportedChainId, contractAddress: contractAddress as string });
      }
      // Remove the current token as the contract address is being modified
      else if (name === 'contractAddress' && !isValidChainAddress(contractAddress as string)) {
        setValue('tokenSymbol', null);
        setValue('tokenLogo', null);
      }
    });
    return () => newContractAddress.unsubscribe();
  }, [watch]);

  async function loadToken(tokenInfo: ITokenMetadataRequest) {
    setLoadingToken(true);
    try {
      const tokenData = await charmClient.getTokenMetaData(tokenInfo);
      setValue('tokenSymbol', tokenData.symbol);
      trigger('tokenSymbol');
      setValue('tokenLogo', tokenData.logo ?? null);
      trigger('tokenLogo');
      setValue('tokenName', tokenData.name ?? null);
      trigger('tokenName');
      setValue('tokenDecimals', tokenData.decimals ?? null);
      trigger('tokenDecimals');
      // If API returns empty data for any field, we allow manual input. Otherwise use pre-filled data
      setAllowManualInput(!!(!tokenData.name || !tokenData.symbol || !tokenData.decimals || !tokenData.logo));
      setLoadingToken(false);
    } catch (error) {
      setValue('tokenLogo', null);
      setValue('tokenSymbol', null);
      setValue('tokenName', null);
      setValue('tokenDecimals', null);
      setAllowManualInput(true);
      setLoadingToken(false);
    }
  }

  function setChainId(_chainId: number) {
    setValue('chainId', _chainId);
  }

  async function addPaymentMethod(paymentMethod: Partial<PaymentMethod>) {
    setFormError(null);
    paymentMethod.spaceId = space?.id;
    paymentMethod.walletType = 'metamask';

    if (!logoLoadSuccess) {
      delete paymentMethod.tokenLogo;
    }

    try {
      const createdPaymentMethod = await charmClient.createPaymentMethod(paymentMethod);
      refreshPaymentMethods();
      onSubmit(createdPaymentMethod);
    } catch (error: any) {
      setFormError(
        new FormError({
          message: error.message || error.error || (typeof error === 'object' ? JSON.stringify(error) : error),
          severity: error.severity,
          errorType: error.errorType ?? 'Unknown'
        })
      );
    }

    return false;
  }

  // Only checks the format, not if we can load the logo
  const validTokenLogoAddressFormat = !!values.tokenLogo && !errors.tokenLogo;

  const isFormValid =
    isValid &&
    (!values.contractAddress ||
      (values.contractAddress && values.tokenDecimals && values.tokenSymbol && values.tokenName));

  return (
    <div>
      {/* @ts-ignore */}
      <form
        onSubmit={(event) => {
          // stop propagation so it doesnt submit parent forms, like reward editor
          event.stopPropagation();
          event.preventDefault();
          handleSubmit(addPaymentMethod as any)(event);
        }}
        style={{ margin: 'auto' }}
      >
        <Grid container direction='column' spacing={3}>
          <Grid item xs>
            <InputLabel>Blockchain</InputLabel>
            <InputSearchBlockchain
              defaultChainId={defaultChainId}
              onChange={(chainId) => {
                setChainId(chainId as number);
              }}
            />
          </Grid>

          <Grid item xs>
            <InputLabel>Contract address</InputLabel>
            <TextField
              {...register('contractAddress')}
              type='text'
              size='small'
              fullWidth
              data-test='custom-token-contract-address'
              error={!!errors.contractAddress?.message}
              helperText={errors.contractAddress?.message}
              InputProps={{
                endAdornment: loadingToken && <Progress color='inherit' size='1em' />
              }}
            />
            {!errors?.contractAddress && allowManualInput && !loadingToken && (
              <Alert severity='info'>
                We couldn't find data about this token. Enter its details below, or select a different blockchain.
              </Alert>
            )}
          </Grid>

          {values.contractAddress && !errors.contractAddress && !loadingToken && (
            <>
              <Grid item container xs>
                <Grid item xs={6} sx={{ pr: 2 }}>
                  <InputLabel>Token symbol</InputLabel>
                  <TextField
                    data-test='custom-token-symbol'
                    InputProps={{
                      readOnly: !allowManualInput
                    }}
                    {...register('tokenSymbol')}
                    size='small'
                    type='text'
                    error={!!errors.tokenSymbol?.message}
                    helperText={errors.tokenSymbol?.message}
                  />
                </Grid>

                <Grid item xs={6} sx={{ pl: 2 }}>
                  <InputLabel>Token decimals</InputLabel>
                  <TextField
                    {...register('tokenDecimals', {
                      valueAsNumber: true
                    })}
                    data-test='custom-token-decimals'
                    type='number'
                    size='small'
                    inputMode='numeric'
                    inputProps={{
                      step: 1,
                      min: 1,
                      max: 18,
                      disabled: !allowManualInput
                    }}
                  />
                </Grid>
              </Grid>
              <Grid item xs>
                <InputLabel>Token name</InputLabel>
                <TextField
                  {...register('tokenName')}
                  data-test='custom-token-name'
                  type='text'
                  size='small'
                  fullWidth
                  InputProps={{
                    readOnly: !allowManualInput
                  }}
                  error={!!errors.tokenName?.message}
                  helperText={errors.tokenName?.message}
                />
              </Grid>

              <Grid item container xs>
                <Grid item xs={validTokenLogoAddressFormat ? 8 : 12}>
                  <InputLabel>Token logo URL</InputLabel>
                  <TextField
                    data-test='custom-token-logo-url'
                    {...register('tokenLogo')}
                    type='text'
                    size='small'
                    fullWidth
                    error={!!errors.tokenLogo?.message}
                    helperText={errors.tokenLogo?.message}
                    placeholder='https://app.charmverse.io/favicon.png'
                  />
                  {(errors?.tokenLogo || (validTokenLogoAddressFormat && !logoLoadSuccess)) && (
                    <Alert severity='error'>Invalid token logo url</Alert>
                  )}
                </Grid>
                {validTokenLogoAddressFormat && (
                  <Grid
                    item
                    xs={4}
                    sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center', verticalAlign: 'center' }}
                  >
                    <img
                      alt=''
                      style={{ maxHeight: '50px' }}
                      src={values.tokenLogo || ''}
                      onError={(error) => {
                        setLogoLoadSuccess(false);
                      }}
                      onLoad={() => {
                        setLogoLoadSuccess(true);
                      }}
                    />
                  </Grid>
                )}
              </Grid>
            </>
          )}
          {formError && (
            <Grid item xs>
              <Alert severity={formError.severity}>{formError.message}</Alert>
            </Grid>
          )}
          <Grid item sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              data-test='create-token-payment-method'
              type='submit'
              disabled={!isFormValid}
              loading={isSubmitting}
            >
              Add token
            </Button>
          </Grid>
        </Grid>
      </form>
    </div>
  );
}
