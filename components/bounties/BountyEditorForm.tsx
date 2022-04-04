import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import { Bounty, Bounty as IBounty } from '@prisma/client';
import charmClient, { PopulatedBounty } from 'charmClient';
import Button from 'components/common/Button';
import { InputBlockchainSearch } from 'components/common/form/InputBlockchains';
import { InputSearchContributor } from 'components/common/form/InputSearchContributor';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import CharmEditor, { ICharmEditorOutput, UpdatePageContent } from 'components/common/CharmEditor/CharmEditor';
import { getChainById } from 'connectors';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { PageContent } from 'models';
import { CryptoCurrency } from 'models/Currency';
import { useState, useEffect } from 'react';
import { useForm, UseFormWatch } from 'react-hook-form';
import { isTruthy } from 'lib/utilities/types';
import * as yup from 'yup';
import { usePaymentMethods } from 'hooks/usePaymentMethods';

export type FormMode = 'create' | 'update';

interface IBountyEditorInput {
  onSubmit: (bounty: PopulatedBounty) => any,
  mode?: FormMode
  bounty?: Partial<Bounty>
}

export const schema = yup.object({
  title: yup.string().required('Please enter a title'),
  rewardAmount: yup.number().typeError('Amount must be a number').required('Please enter reward amount'),
  rewardToken: yup.string().required(),
  descriptionNodes: yup.mixed(),
  description: yup.string(),
  reviewer: yup.string().nullable(true),
  chainId: yup.number().required()
});

type FormValues = yup.InferType<typeof schema>

// This component was created to localize the state change of CharmEditor
// Otherwise watching inside its parent would've caused the whole component tree to rerender
function FormDescription ({ onContentChange, content, watch }:
  {content?: PageContent, onContentChange: UpdatePageContent, watch: UseFormWatch<FormValues>}) {
  watch(['description', 'descriptionNodes']);

  return (
    <Grid item>
      <InputLabel>
        Description
      </InputLabel>
      <CharmEditor
        content={content}
        onContentChange={onContentChange}
      />
    </Grid>
  );
}

export function BountyEditorForm ({ onSubmit, bounty, mode = 'create' }: IBountyEditorInput) {
  const { setBounties, bounties } = useBounties();

  const defaultChainId = bounty?.chainId ?? 1;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isSubmitting }
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      rewardToken: 'ETH' as CryptoCurrency,
      // TBC till we agree on Prisma migration
      chainId: defaultChainId as any,
      ...(bounty || {})
    },
    resolver: yupResolver(schema)
  });

  const [space] = useCurrentSpace();
  const [user] = useUser();
  const [paymentMethods] = usePaymentMethods();

  const [availableCryptos, setAvailableCryptos] = useState<Array<string | CryptoCurrency>>([]);

  useEffect(() => {
    refreshCryptoList(defaultChainId);
  }, []);

  async function submitted (value: IBounty) {

    if (mode === 'create') {
      value.spaceId = space!.id;
      value.createdBy = user!.id;
      value.description = value.description ?? '';
      value.descriptionNodes = value.descriptionNodes ?? '';
      const createdBounty = await charmClient.createBounty(value);
      const populatedBounty = { ...createdBounty, applications: [] };
      setBounties([...bounties, populatedBounty]);
      onSubmit(populatedBounty);
    }
    else if (bounty?.id && mode === 'update') {
      const updates = {
        updatedAt: new Date(),
        title: value.title,
        rewardAmount: value.rewardAmount,
        rewardToken: value.rewardToken,
        descriptionNodes: value.descriptionNodes,
        description: value.description,
        reviewer: value.reviewer,
        chainId: value.chainId
      };
      const updatedBounty = await charmClient.updateBounty(bounty.id, updates);
      setBounties(bounties.map(b => b.id === bounty.id ? updatedBounty : b));
      onSubmit(updatedBounty);
    }
  }

  function setRichContent (content: ICharmEditorOutput) {
    setValue('descriptionNodes', content.doc);
    setValue('description', content.rawText);
  }

  function setReviewer (userId: string) {
    setValue('reviewer', userId);
  }

  function setChainId (chainId: number) {
    setValue('chainId', chainId);

    refreshCryptoList(chainId);
  }

  function refreshCryptoList (chainId: number) {

    // Set the default chain currency
    const selectedChain = getChainById(chainId);

    if (selectedChain) {

      const nativeCurrency = selectedChain.nativeCurrency.symbol;

      const cryptosToDisplay = [nativeCurrency];

      const contractAddresses = paymentMethods
        .filter(method => method.chainId === chainId)
        .map(method => {
          return method.contractAddress;
        })
        .filter(isTruthy);
      cryptosToDisplay.push(...contractAddresses);

      setAvailableCryptos(cryptosToDisplay);
      setValue('rewardToken', nativeCurrency);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit(formValue => submitted(formValue as IBounty))} style={{ margin: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <InputLabel>
              Bounty title
            </InputLabel>
            <Input
              {...register('title')}
              type='text'
              fullWidth
            />
            {
              errors?.title && (
              <Alert severity='error'>
                {errors.title.message}
              </Alert>
              )
            }
          </Grid>
          <FormDescription
            watch={watch}
            content={bounty?.descriptionNodes as PageContent}
            onContentChange={(pageContent) => {
              setRichContent(pageContent);
            }}
          />
          <Grid item>
            <InputLabel>
              Reviewer
            </InputLabel>
            <InputSearchContributor defaultValue={bounty?.reviewer as string} onChange={setReviewer} />
          </Grid>
          <Grid container item>
            <Grid item xs>
              <InputLabel>
                Select a chain for this transaction
              </InputLabel>
              <InputBlockchainSearch
                defaultChainId={defaultChainId}
                onChange={setChainId}
              />
            </Grid>
          </Grid>
          {

          }
          <Grid container item>
            <Grid item xs={6}>
              <InputLabel>
                Reward amount
              </InputLabel>
              <TextField
                {...register('rewardAmount', {
                  valueAsNumber: true
                })}
                type='number'
                inputProps={{ step: 0.000000001 }}
              />
              {
              errors?.rewardAmount && (
              <Alert severity='error'>
                {errors.rewardAmount.message}
              </Alert>
              )
            }
            </Grid>
            <Grid item xs={6}>
              <InputLabel>
                Reward token
              </InputLabel>
              <InputSearchCrypto
                cryptoList={availableCryptos}
                defaultValue={bounty?.rewardToken}
                onChange={newToken => {
                  setValue('rewardToken', newToken);
                }}
              />
            </Grid>
          </Grid>
          <Grid item>
            <Button loading={isSubmitting} disabled={!isValid} type='submit'>{mode === 'create' ? 'Create bounty' : 'Update bounty'}</Button>
          </Grid>
        </Grid>
      </form>
    </div>
  );
}
