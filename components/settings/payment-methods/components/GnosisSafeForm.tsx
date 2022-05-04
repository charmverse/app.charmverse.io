import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import { PaymentMethod } from '@prisma/client';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import InputSearchBlockchain from 'components/common/form/InputSearchBlockchain';
import { getChainById } from 'connectors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { isValidChainAddress } from 'lib/tokens/validation';
import { ISystemError } from 'lib/utilities/errors';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { FormError } from 'components/common/form/FormError.class';

export type FormMode = 'create' | 'update';

interface Props {
  onSubmit: (paymentMethod: Partial<PaymentMethod>) => any,
  defaultChainId?: number
  isPersonalSafe?: boolean
}

export const schema = yup.object({
  chainId: yup.number().required('Please select a chain'),
  gnosisSafeAddress: yup.string().test('verifyContractFormat', 'Invalid contract address', (value) => {
    return !value || isValidChainAddress(value);
  }),
  tokenSymbol: yup.string().nullable(true),
  tokenName: yup.string().nullable(true),
  tokenLogo: yup.string().nullable(true),
  tokenDecimals: yup.number().nullable(true)
});

type FormValues = yup.InferType<typeof schema>

export default function GnosisSafeForm ({ onSubmit, isPersonalSafe, defaultChainId = 1 }: Props) {

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      // TBC till we agree on Prisma migration
      chainId: defaultChainId
    },
    resolver: yupResolver(schema)
  });

  const [space] = useCurrentSpace();

  const [formError, setFormError] = useState<ISystemError | null>(null);

  const values = watch();

  useEffect(() => {
    const chain = getChainById(values.chainId);
    if (chain) {
      setValue('tokenSymbol', chain.nativeCurrency.symbol);
      setValue('tokenName', chain.nativeCurrency.name);
      setValue('tokenDecimals', chain.nativeCurrency.decimals);
      setValue('tokenLogo', chain.nativeCurrency.logoURI);
    }
  }, [values.chainId]);

  function setChainId (_chainId: number) {
    setValue('chainId', _chainId);
  }

  async function addPaymentMethod (paymentMethod: Partial<PaymentMethod>) {
    setFormError(null);
    paymentMethod.spaceId = space?.id;
    paymentMethod.walletType = 'gnosis';

    try {
      console.log('isPersonalSafe', isPersonalSafe);
      if (isPersonalSafe) {
        const createdPaymentMethod = await charmClient.createUserMultiSig({
          address: paymentMethod.gnosisSafeAddress || '',
          chainId: paymentMethod.chainId
        });
        onSubmit(createdPaymentMethod);
      }
      else {
        const createdPaymentMethod = await charmClient.createPaymentMethod(paymentMethod);
        onSubmit(createdPaymentMethod);
      }
    }
    catch (error: any) {
      setFormError(
        new FormError({
          message: error.message || error.error || (typeof error === 'object' ? JSON.stringify(error) : error),
          severity: error.severity,
          errorType: error.errorType ?? 'Unknown'
        })
      );
    }
  }

  function onAddressChange (e: any) {
    // remove prefix added by gnosis safe on their app
    const value = e.target.value.replace('rin:', '');
    setValue('gnosisSafeAddress', value);
  }

  return (
    <div>
      {/* @ts-ignore */}
      <form onSubmit={handleSubmit(addPaymentMethod)} style={{ margin: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
        <Grid container direction='column' spacing={3}>

          <Grid item xs>
            <InputLabel>
              Blockchain
            </InputLabel>
            <InputSearchBlockchain
              defaultChainId={defaultChainId}
              onChange={setChainId}
            />
          </Grid>

          <Grid item xs>
            <TextField
              {...register('gnosisSafeAddress')}
              fullWidth
              size='small'
              onChange={onAddressChange}
              placeholder='Enter Gnosis Safe address'
              error={!!errors.gnosisSafeAddress?.message}
              helperText={errors.gnosisSafeAddress?.message}
            />
          </Grid>
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
            <Button type='submit' disabled={!isValid || (values.gnosisSafeAddress === '')}>
              {isPersonalSafe ? 'Add wallet' : 'Create payment method'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </div>
  );
}
