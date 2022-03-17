import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/Input';
import TextField from '@mui/material/TextField';
import Progress from '@mui/material/CircularProgress';
import InputLabel from '@mui/material/InputLabel';
import { PaymentMethod } from '@prisma/client';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { InputBlockchainSearch } from 'components/common/form/InputBlockchains';
import { getCryptos } from 'connectors';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useUser } from 'hooks/useUser';
import { ITokenMetadataRequest } from 'lib/tokens/tokenData';
import { isValidChainAddress } from 'lib/tokens/validation';
import { IUserError } from 'lib/utilities/errors';
import { CryptoCurrency } from 'models/Currency';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

export type FormMode = 'create' | 'update';

interface Props {
  onSubmit: (paymentMethod: Partial<PaymentMethod>) => any,
  defaultChainId?: number
}

export const schema = yup.object({
  chainId: yup.number().required('Please select a chain'),
  contractAddress: yup.string().required().test('verifyContractFormat', 'Invalid contract address', (value) => {
    return isValidChainAddress(value as string);
  }),
  tokenSymbol: yup.string().required(),
  tokenName: yup.string().required(),
  tokenLogo: yup.string(),
  tokenDecimals: yup.number()
});

type FormValues = yup.InferType<typeof schema>

export function CustomErcTokenForm ({ onSubmit, defaultChainId = 1 }: Props) {

  const [loadingToken, setLoadingToken] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    trigger,
    reset,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      // TBC till we agree on Prisma migration
      chainId: defaultChainId as any,
      tokenDecimals: 18
      // Default for an ERC20 token
    },
    resolver: yupResolver(schema)
  });

  const [,, refreshPaymentMethods] = usePaymentMethods();
  const [space] = useCurrentSpace();

  const [allowManualInput, setAllowManualInput] = useState(false);
  const [formError, setFormError] = useState<IUserError | null>(null);
  // Checks if we could load the logo
  const [logoLoadSuccess, setLogoLoadSuccess] = useState(false);

  useEffect(() => {
    const newContractAddress = watch(({ contractAddress, chainId }, { value, name }) => {

      if ((name === 'contractAddress' || name === 'chainId') && isValidChainAddress(contractAddress as string)) {
        loadToken({ chainId: chainId as number, contractAddress: contractAddress as string });
      }
      // Remove the current token as the contract address is being modified
      else if (name === 'contractAddress' && !isValidChainAddress(contractAddress as string)) {
        setValue('tokenSymbol', null as any);
        setValue('tokenLogo', null as any);
      }
    });
    return () => newContractAddress.unsubscribe();
  }, [watch]);

  async function loadToken (tokenInfo: ITokenMetadataRequest) {
    setLoadingToken(true);
    try {
      const tokenData = await charmClient.getTokenMetaData(tokenInfo);
      setValue('tokenSymbol', tokenData.symbol);
      trigger('tokenSymbol');
      setValue('tokenLogo', tokenData.logo ?? undefined);
      trigger('tokenLogo');
      setValue('tokenName', tokenData.name ?? undefined);
      trigger('tokenName');
      setValue('tokenDecimals', tokenData.decimals ?? undefined);
      trigger('tokenDecimals');
      setAllowManualInput(false);
      setLoadingToken(false);
    }
    catch (error) {
      setValue('tokenLogo', null as any);
      setValue('tokenSymbol', null as any);
      setValue('tokenName', null as any);
      setValue('tokenDecimals', null as any);
      setAllowManualInput(true);
      setLoadingToken(false);
    }
  }

  const values = watch();

  function setChainId (_chainId: number) {
    setValue('chainId', _chainId);
  }

  async function addPaymentMethod (paymentMethod: Partial<PaymentMethod>) {
    setFormError(null);
    paymentMethod.spaceId = space?.id;
    if (!logoLoadSuccess) {
      delete paymentMethod.tokenLogo;
    }

    try {
      const createdPaymentMethod = await charmClient.createPaymentMethod(paymentMethod);
      refreshPaymentMethods();
      onSubmit(createdPaymentMethod);
    }
    catch (error: any) {
      setFormError({
        message: error.message || error.error || (typeof error === 'object' ? JSON.stringify(error) : error),
        severity: error.severity ?? 'error'
      });
    }

  }

  // Only checks the format, not if we can load the logo
  const validTokenLogoAddressFormat = !!values.tokenLogo && !errors.tokenLogo;

  return (
    <div>
      <form onSubmit={handleSubmit(addPaymentMethod)} style={{ margin: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
        <Grid container direction='column' spacing={3}>

          <Grid item xs>
            <InputLabel>
              Which chain is your custom token on?
            </InputLabel>
            <InputBlockchainSearch
              defaultChainId={defaultChainId}
              onChange={setChainId}
            />
          </Grid>

          <Grid item xs>
            <InputLabel>
              Contract address
            </InputLabel>
            <TextField
              {...register('contractAddress')}
              type='text'
              fullWidth
              error={!!errors.contractAddress?.message}
              helperText={errors.contractAddress?.message}
            />
            {
              !(errors?.contractAddress) && allowManualInput && !loadingToken && (
                <Alert severity='info'>
                  We couldn't find data about this token. Enter its details below, or select a different blockchain.
                </Alert>
              )
            }
          </Grid>

          {
            loadingToken && <Progress />
          }

          {
            values.contractAddress && !errors.contractAddress && !loadingToken && (
              <>
                <Grid item container xs>
                  <Grid item xs={6} sx={{ pr: 2 }}>
                    <InputLabel>
                      Token symbol
                    </InputLabel>
                    <TextField
                      InputProps={{
                        readOnly: !allowManualInput
                      }}
                      {...register('tokenSymbol')}
                      type='text'
                      error={!!errors.tokenSymbol?.message}
                      helperText={errors.tokenSymbol?.message}
                    />
                  </Grid>

                  <Grid item xs={6} sx={{ pl: 2 }}>
                    <InputLabel>
                      Token decimals
                    </InputLabel>
                    <Input
                      {...register('tokenDecimals')}
                      type='number'
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
                  <InputLabel>
                    Token name
                  </InputLabel>
                  <TextField
                    {...register('tokenName')}
                    type='text'
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
                    <InputLabel>
                      Token logo URL
                    </InputLabel>
                    <TextField
                      {...register('tokenLogo')}
                      type='text'
                      fullWidth
                      error={!!errors.tokenLogo?.message}
                      helperText={errors.tokenLogo?.message}
                      placeholder='https://app.charmverse.io/favicon.png'
                    />
                    {
              (errors?.tokenLogo || (validTokenLogoAddressFormat && !logoLoadSuccess)) && (
              <Alert severity='error'>
                Invalid token logo url
              </Alert>
              )
            }
                  </Grid>
                  {
              validTokenLogoAddressFormat && (
                <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center', verticalAlign: 'center' }}>
                  <img
                    alt=''
                    style={{ maxHeight: '50px' }}
                    src={values.tokenLogo}
                    onError={(error) => {
                      setLogoLoadSuccess(false);
                    }}
                    onLoad={() => {
                      setLogoLoadSuccess(true);
                    }}
                  />
                </Grid>
              )
            }
                </Grid>

              </>
            )
          }
          {
            formError && (
              <Grid item xs>
                <Alert severity={formError.severity}>
                  {formError.message}
                </Alert>
              </Grid>
            )
          }
          <Grid item>
            <Button type='submit' disabled={!isValid}>Create payment method</Button>
          </Grid>
        </Grid>
      </form>
    </div>
  );
}
