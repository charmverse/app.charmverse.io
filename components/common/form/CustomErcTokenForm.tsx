import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import { Bounty, Bounty as IBounty } from '@prisma/client';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { InputBlockchainSearch } from 'components/common/form/InputBlockchains';
import { InputSearchContributor } from 'components/common/form/InputSearchContributor';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import CharmEditor, { ICharmEditorOutput, UpdatePageContent } from 'components/editor/CharmEditor';
import { getChainById, getCryptos } from 'connectors';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { PageContent } from 'models';
import { CryptoCurrency } from 'models/Currency';
import { useState, useEffect } from 'react';
import { useForm, UseFormWatch } from 'react-hook-form';
import * as yup from 'yup';
import { ITokenMetadataRequest } from 'lib/tokens/tokenData';

import { isValidChainAddress } from 'lib/tokens/validation';

export type FormMode = 'create' | 'update';

interface Props {
  onSubmit: (bounty: Bounty) => any,
  defaultChainId?: number
}

export const schema = yup.object({
  chainId: yup.number().required('Please select a chain'),
  contractAddress: yup.string().required().test('verifyContractFormat', 'Invalid contract address', (value) => {
    return isValidChainAddress(value as string);
  }),
  tokenSymbol: yup.string().required()
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

  const [space] = useCurrentSpace();
  const [user] = useUser();

  const [availableCryptos, setAvailableCryptos] = useState<Array<string | CryptoCurrency>>(getCryptos(defaultChainId));
  const [allowManualSymbolInput, setAllowManualSymbolInput] = useState(false);

  useEffect(() => {
    const newContractAddress = watch(({ contractAddress, chainId }, { value, name }) => {

      if ((name === 'contractAddress' || name === 'chainId') && isValidChainAddress(contractAddress as string)) {
        loadToken({ chainId: chainId as number, contractAddress: contractAddress as string });
      }
      // Remove the current token as the contract address is being modified
      else if (name === 'contractAddress' && !isValidChainAddress(contractAddress as string)) {
        setValue('tokenSymbol', null as any);
      }
    });
    return () => newContractAddress.unsubscribe();
  }, [watch]);

  async function loadToken (tokenInfo: ITokenMetadataRequest) {
    try {
      const tokenData = await charmClient.getTokenMetaData(tokenInfo);
      setValue('tokenSymbol', tokenData.symbol);
      trigger('tokenSymbol');
      setAllowManualSymbolInput(false);
    }
    catch (error) {
      setAllowManualSymbolInput(true);
    }
  }

  const values = watch();

  async function submitted (value: any) {

    console.log('Adding payment method', value);
  }

  function setChainId (_chainId: number) {
    setValue('chainId', _chainId);
    setValue('tokenSymbol', null as any);
  }

  return (
    <div>
      <form onSubmit={handleSubmit(formValue => submitted(formValue))} style={{ margin: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
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
          <Grid container item>
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
          </Grid>
          <Grid item>
            <Button disabled={!isValid}>Set payment token</Button>
          </Grid>
        </Grid>
      </form>
    </div>
  );
}
