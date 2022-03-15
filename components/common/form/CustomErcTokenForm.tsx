import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/Input';
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
  tokenLogo: yup.string()
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
    formState: { errors, isValid }
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      // TBC till we agree on Prisma migration
      chainId: defaultChainId as any
    },
    resolver: yupResolver(schema)
  });

  const [paymentMethods, setPaymentMethods, refreshPaymentMethods] = usePaymentMethods();

  const [space] = useCurrentSpace();
  const [user] = useUser();

  const [availableCryptos, setAvailableCryptos] = useState<Array<string | CryptoCurrency>>(getCryptos(defaultChainId));
  const [allowManualSymbolInput, setAllowManualSymbolInput] = useState(false);
  const [formError, setFormError] = useState<IUserError | null>(null);

  useEffect(() => {
    console.log('event');
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
    try {
      const tokenData = await charmClient.getTokenMetaData(tokenInfo);
      setValue('tokenSymbol', tokenData.symbol);
      trigger('tokenSymbol');
      setValue('tokenLogo', tokenData.logo ?? undefined);
      trigger('tokenLogo');
      setAllowManualSymbolInput(false);
    }
    catch (error) {
      setValue('tokenLogo', null as any);
      setValue('tokenSymbol', null as any);
      setAllowManualSymbolInput(true);
    }
  }

  const values = watch();

  function setChainId (_chainId: number) {
    setValue('chainId', _chainId);
    setValue('tokenSymbol', null as any);
  }

  async function addPaymentMethod (paymentMethod: Partial<PaymentMethod>) {
    setFormError(null);
    paymentMethod.spaceId = space?.id;
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
              !(errors?.contractAddress) && allowManualSymbolInput && (
              <Alert severity='warning'>
                We couldn't find data about this token. You can enter its symbol below
              </Alert>
              )
            }
          </Grid>
          <Grid item xs>
            {
                allowManualSymbolInput === true && !errors.contractAddress && (
                  <>
                    <InputLabel>
                      Token symbol
                    </InputLabel>
                    <Input
                      {...register('tokenSymbol')}
                      type='text'
                      fullWidth
                    />
                  </>
                )
              }
            {
                allowManualSymbolInput === false && values.tokenSymbol && (
                  <p>{`Token symbol: ${values.tokenSymbol}`}</p>
                )
              }
          </Grid>

          <Grid item xs>
            {
                allowManualSymbolInput === true && !errors.contractAddress && (
                  <>
                    <InputLabel>
                      Token logo
                    </InputLabel>
                    <Input
                      {...register('tokenLogo')}
                      type='text'
                    />
                  </>
                )
              }
            {
                allowManualSymbolInput === false && values.tokenLogo && (
                  <img alt='Crypto logo' src={values.tokenLogo} />
                )
              }
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
            <Button type='submit' disabled={!isValid}>Set payment method</Button>
          </Grid>
        </Grid>
      </form>
    </div>
  );
}
