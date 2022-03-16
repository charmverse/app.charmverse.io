import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/Input';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import { PaymentMethod, WalletType } from '@prisma/client';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { InputBlockchainSearch } from 'components/common/form/InputBlockchains';
import { getChainById } from 'connectors';
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
  contractAddress: yup.string().nullable(true).test('verifyContractFormat', 'Invalid contract address', (value) => {
    return !value || isValidChainAddress(value);
  }),
  gnosisSafeAddress: yup.string().test('verifyContractFormat', 'Invalid contract address', (value) => {
    return !value || isValidChainAddress(value);
  }),
  tokenSymbol: yup.string().required().nullable(true),
  tokenName: yup.string().required().nullable(true),
  tokenLogo: yup.string().nullable(true),
  tokenDecimals: yup.number().nullable(true),
  walletType: yup.mixed<WalletType>().required().oneOf(['metamask', 'gnosis'])
});

type FormValues = yup.InferType<typeof schema>

export function CustomErcTokenForm ({ onSubmit, defaultChainId = 1 }: Props) {
  const { setBounties, bounties } = useBounties();

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
      walletType: 'metamask'
    },
    resolver: yupResolver(schema)
  });

  const [,, refreshPaymentMethods] = usePaymentMethods();
  const [space] = useCurrentSpace();

  const [allowManualInput, setAllowManualInput] = useState(false);
  const [formError, setFormError] = useState<IUserError | null>(null);
  // Checks if we could load the logo
  const [logoLoadSuccess, setLogoLoadSuccess] = useState(false);

  const values = watch();

  useEffect(() => {
    const newContractAddress = watch(({ contractAddress, chainId }, { value, name }) => {

      if ((name === 'contractAddress' || name === 'chainId') && isValidChainAddress(contractAddress as string)) {
        loadToken({ chainId: chainId as number, contractAddress: contractAddress as string });
      }
    });
    return () => newContractAddress.unsubscribe();
  }, [watch]);

  useEffect(() => {
    if (values.gnosisSafeAddress) {
      const chain = getChainById(values.chainId);
      if (chain) {
        setValue('tokenSymbol', chain.nativeCurrency.symbol);
        setValue('tokenName', chain.nativeCurrency.name);
        setValue('tokenDecimals', chain.nativeCurrency.decimals);
        setValue('tokenLogo', null);
        setValue('contractAddress', null);
      }
    }
  }, [values.chainId, values.gnosisSafeAddress]);

  async function loadToken (tokenInfo: ITokenMetadataRequest) {
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
    }
    catch (error) {
      setValue('tokenLogo', null);
      setValue('tokenSymbol', null as any);
      setValue('tokenName', null as any);
      setValue('tokenDecimals', null);
      setAllowManualInput(true);
    }
  }

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
        message: error.message,
        severity: error.severity ?? 'error'
      });
    }

  }

  // Only checks the format, not if we can load the logo
  const validTokenLogoAddressFormat = !!values.tokenLogo && !errors.tokenLogo;
  console.log(errors, values);
  return (
    <div>
      {/* @ts-ignore */}
      <form onSubmit={handleSubmit(addPaymentMethod)} style={{ margin: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
        <Grid container direction='column' spacing={3}>

          <Grid item xs>
            <InputLabel>
              Wallet Type
            </InputLabel>
            <Select
              {...register('walletType')}
              displayEmpty
              fullWidth
              renderValue={(selected) => {
                if (!selected) {
                  return <Typography color='secondary'>Select a wallet type</Typography>;
                }
                return selected === 'metamask' ? 'Metamask' : 'Gnosis Safe';
              }}
            >
              <MenuItem value='metamask'>Metamask</MenuItem>
              <MenuItem value='gnosis'>Gnosis Safe</MenuItem>
            </Select>
          </Grid>
          <Grid item xs>
            <InputLabel>
              Blockchain
            </InputLabel>
            <InputBlockchainSearch
              defaultChainId={defaultChainId}
              onChange={setChainId}
            />
          </Grid>
          {values.walletType === 'gnosis' && (
            <Grid item xs>
              <TextField
                {...register('gnosisSafeAddress')}
                fullWidth
                placeholder='Enter Gnosis Safe address'
                error={!!errors.gnosisSafeAddress?.message}
                helperText={errors.gnosisSafeAddress?.message}
              />
            </Grid>
          )}

          {values.walletType === 'metamask' && (
            <Grid item xs>
              <InputLabel>
                Contract address
              </InputLabel>
              <Input
                {...register('contractAddress')}
                type='text'
                fullWidth
              />
              {
                errors?.contractAddress && (
                <Alert severity='error'>
                  {errors.contractAddress.message}
                </Alert>
                )
              }
              {
                !(errors?.contractAddress) && allowManualInput && (
                <Alert severity='warning'>
                  We couldn't find data about this token. You can enter its symbol below
                </Alert>
                )
              }
            </Grid>
          )}
          {
            values.contractAddress && !errors.contractAddress && (
              <>
                <Grid item container xs>
                  <Grid item xs={6} sx={{ pr: 2 }}>
                    <InputLabel>
                      Token symbol
                    </InputLabel>
                    <Input
                      readOnly={!allowManualInput}
                      {...register('tokenSymbol')}
                      type='text'
                    />
                  </Grid>

                  <Grid item xs={6} sx={{ pl: 2 }}>
                    <InputLabel>
                      Token decimals
                    </InputLabel>
                    <Input
                      {...register('tokenDecimals')}
                      type='number'
                      readOnly={!allowManualInput}
                      inputProps={{
                        step: 1,
                        min: 1,
                        max: 18,
                        readonly: !allowManualInput
                      }}
                    />
                  </Grid>
                </Grid>
                <Grid item xs>
                  <InputLabel>
                    Token name
                  </InputLabel>
                  <Input
                    {...register('tokenName')}
                    type='text'
                    fullWidth
                    readOnly={!allowManualInput}
                  />
                </Grid>

                <Grid item container xs>
                  <Grid item xs={validTokenLogoAddressFormat ? 8 : 12}>
                    <InputLabel>
                      Token logo
                    </InputLabel>
                    <Input
                      {...register('tokenLogo')}
                      type='text'
                      fullWidth
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
              validTokenLogoAddressFormat && values.tokenLogo && (
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
