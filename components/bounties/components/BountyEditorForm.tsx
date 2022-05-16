import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import FieldLabel from 'components/common/form/FieldLabel';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import { Bounty, Bounty as IBounty, PaymentMethod } from '@prisma/client';
import charmClient, { PopulatedBounty } from 'charmClient';
import Button from 'components/common/Button';
import CharmEditor, { ICharmEditorOutput, UpdatePageContent } from 'components/common/CharmEditor/CharmEditor';
import InputSearchBlockchain from 'components/common/form/InputSearchBlockchain';
import { InputSearchContributor } from 'components/common/form/InputSearchContributor';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import { getChainById } from 'connectors';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useUser } from 'hooks/useUser';
import { isTruthy } from 'lib/utilities/types';
import { PageContent } from 'models';
import { CryptoCurrency } from 'models/Currency';
import { useEffect, useState } from 'react';
import { useForm, UseFormWatch } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers';
import * as yup from 'yup';

export type FormMode = 'create' | 'update' | 'suggest';

export const bountyFormTitles: Record<FormMode, string> = {
  create: 'Create bounty',
  update: 'Edit bounty',
  suggest: 'Suggest bounty'
};

export const schema = yup.object({
  title: yup.string().required('Please enter a title'),
  rewardAmount: yup.number().typeError('Amount must be a number').test({
    message: 'Amount must be greater than 0',
    test: value => {
      return value !== 0;
    }
  }),
  rewardToken: yup.string().required(),
  descriptionNodes: yup.mixed(),
  description: yup.string(),
  reviewer: yup.string().nullable(true),
  chainId: yup.number().required(),
  // New fields
  approveSubmitters: yup.boolean(),
  capSubmissions: yup.boolean(),
  maxSubmissions: yup.number(),
  setExpiryDate: yup.boolean(),
  expiryDate: yup.mixed()
});

export type FormValues = yup.InferType<typeof schema>

/**
 * @focusKey The field that should be focused on popup. The underlying field should be using a native MUI field for this to work
 */
interface IBountyEditorInput {
  onSubmit: (bounty: PopulatedBounty) => any,
  mode?: FormMode
  bounty?: Partial<Bounty>
  focusKey?: keyof FormValues
}

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
        disabledPageSpecificFeatures
        content={content}
        onContentChange={onContentChange}
      />
    </Grid>
  );
}

export default function BountyEditorForm ({ onSubmit, bounty, mode = 'create', focusKey }: IBountyEditorInput) {
  const { setBounties, bounties, updateBounty } = useBounties();

  const defaultChainId = bounty?.chainId ?? 1;

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
      rewardToken: 'ETH' as CryptoCurrency,
      // TBC till we agree on Prisma migration
      chainId: defaultChainId as any,
      maxSubmissions: 1 as any,
      approveSubmitters: true,
      capSubmissions: true,
      expiryDate: null,
      ...(bounty || {}),
      setExpiryDate: !!bounty?.expiryDate
    },
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    if (focusKey) {
      trigger(focusKey);
    }
  }, [focusKey]);

  const values = watch();

  console.log('Values', values);

  const [space] = useCurrentSpace();
  const [user] = useUser();
  const [paymentMethods] = usePaymentMethods();

  const [availableCryptos, setAvailableCryptos] = useState<Array<string | CryptoCurrency>>([]);

  const chainId = watch('chainId');
  const rewardToken = watch('rewardToken');

  useEffect(() => {
    refreshCryptoList(defaultChainId, bounty?.rewardToken);
  }, []);

  async function submitted (value: IBounty) {

    if (!(value as FormValues).setExpiryDate) {
      value.expiryDate = null;
    }

    delete (value as FormValues).setExpiryDate;

    if (mode === 'create') {
      value.spaceId = space!.id;
      value.createdBy = user!.id;
      value.description = value.description ?? '';
      value.descriptionNodes = value.descriptionNodes ?? '';
      value.status = 'open';

      const createdBounty = await charmClient.createBounty(value);
      const populatedBounty = { ...createdBounty, applications: [] };
      setBounties([...bounties, populatedBounty]);
      onSubmit(populatedBounty);
    }
    else if (mode === 'suggest') {
      value.spaceId = space!.id;
      value.createdBy = user!.id;
      value.description = value.description ?? '';
      value.descriptionNodes = value.descriptionNodes ?? '';
      value.status = 'suggestion';

      value.rewardToken = 'ETH';
      value.rewardAmount = 0;
      value.chainId = 1;

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

      const updatedBounty = await updateBounty(bounty.id, updates);
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

  function setChainId (_chainId: number) {
    setValue('chainId', _chainId);
    refreshCryptoList(_chainId);
  }

  function refreshCryptoList (_chainId: number, _rewardToken?: string) {

    // Set the default chain currency
    const selectedChain = getChainById(_chainId);

    if (selectedChain) {

      const nativeCurrency = selectedChain.nativeCurrency.symbol;

      const cryptosToDisplay = [nativeCurrency];

      const contractAddresses = paymentMethods
        .filter(method => method.chainId === _chainId)
        .map(method => {
          return method.contractAddress;
        })
        .filter(isTruthy);
      cryptosToDisplay.push(...contractAddresses);

      setAvailableCryptos(cryptosToDisplay);
      setValue('rewardToken', _rewardToken || nativeCurrency);
    }
  }

  function onNewPaymentMethod (paymentMethod: PaymentMethod) {
    if (paymentMethod.contractAddress) {
      setValue('chainId', paymentMethod.chainId);
      refreshCryptoList(paymentMethod.chainId, paymentMethod.contractAddress);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit(formValue => submitted(formValue as IBounty))} style={{ margin: 'auto' }}>
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

          {
            mode !== 'suggest' && (
              <>
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
                    <InputSearchBlockchain
                      chainId={chainId}
                      onChange={setChainId}
                    />
                  </Grid>
                </Grid>

                <Grid container item>
                  <Grid item xs={6}>
                    <InputLabel>
                      Reward amount
                    </InputLabel>
                    <TextField
                      {...register('rewardAmount', {
                        valueAsNumber: true,
                        required: true
                      })}
                      focused={focusKey === 'rewardAmount'}
                      type='number'
                      size='small'
                      error={!!errors?.rewardAmount}
                      helperText={errors?.rewardAmount?.message}
                      inputProps={{ step: 0.000000001 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <InputLabel>
                      Reward token
                    </InputLabel>
                    <InputSearchCrypto
                      cryptoList={availableCryptos}
                      chainId={chainId}
                      defaultValue={bounty?.rewardToken}
                      value={rewardToken}
                      hideBackdrop={true}
                      onChange={newToken => {
                        setValue('rewardToken', newToken);
                      }}
                      onNewPaymentMethod={onNewPaymentMethod}
                    />
                  </Grid>
                </Grid>
              </>
            )
          }

          {/* New options */}

          <Grid container item>
            <Grid item xs={4}>
              <InputLabel>
                Require applications
              </InputLabel>
              <Switch
                {...register('approveSubmitters')}
                defaultChecked={values.approveSubmitters}
              />

            </Grid>
            <Grid item xs={8}>
              {
                values.approveSubmitters ? (
                  <Alert severity='warning'>
                    Workspace members will have to apply to work on this bounty. They will be able to submit work once their application is accepted.
                  </Alert>
                ) : (
                  <Alert severity='info'>
                    Any workspace member can make a submission to this bounty.
                  </Alert>
                )
              }

            </Grid>
          </Grid>
          <Grid container item>

            <Grid item xs={values.capSubmissions ? 6 : 4}>
              <InputLabel>
                Cap submissions
              </InputLabel>
              <Switch
                {...register('capSubmissions')}
                defaultChecked={values.capSubmissions}
              />
            </Grid>

            <Grid item xs={values.capSubmissions ? 6 : 8}>

              {
                values.capSubmissions === false ? (
                  <Alert severity='info'>
                    {
                      values.approveSubmitters ? 'Workspace members can apply to this bounty as long as it remains open.' : 'Workspace members can make submissions for this bounty as long as it remains open.'
                    }

                  </Alert>
                ) : (
                  <>
                    <InputLabel>
                      Maximum submissions
                    </InputLabel>
                    <TextField
                      {...register('maxSubmissions', {
                        valueAsNumber: true,
                        required: true,
                        shouldUnregister: true
                      })}
                      fullWidth
                      focused={focusKey === 'maxSubmissions'}
                      type='number'
                      size='small'
                      error={!!errors?.maxSubmissions}
                      helperText={errors?.maxSubmissions?.message}
                      inputProps={{ step: 1, min: 1 }}
                    />
                  </>

                )
              }

            </Grid>
          </Grid>

          <Grid container item>
            <Grid item xs={values.setExpiryDate ? 6 : 4}>
              <InputLabel>
                Set expiry date
              </InputLabel>
              <Switch
                {...register('setExpiryDate')}
                defaultChecked={values.setExpiryDate}
              />
            </Grid>

            {
              values.setExpiryDate && (
                <Grid item xs={6}>
                  <InputLabel>Expiry date</InputLabel>
                  <DatePicker
                    {...register('expiryDate', {
                      required: true,
                      shouldUnregister: true
                    })}
                    value={values.expiryDate}
                    onChange={(value) => {
                      setValue('expiryDate', value);
                    }}
                    renderInput={(props) => (
                      <TextField
                        fullWidth
                        name='expiryDate'
                        {...props}
                      />
                    )}
                  />
                </Grid>
              )
              }

            {
                !values.setExpiryDate && (
                  <Grid item xs={8}>
                    <Alert severity='info'>
                      {
                        values.approveSubmitters ? 'Workspace members can apply to this bounty until the expiry date.' : 'Workspace members can make new submissions for this bounty until the expiry date.'
                      }

                    </Alert>
                  </Grid>
                )
              }
          </Grid>

          <Grid item>
            <Button
              loading={isSubmitting}
              disabled={mode === 'suggest' ? (!values.title || !values.description) : !isValid}
              type='submit'
            >
              {bountyFormTitles[mode]}
            </Button>
          </Grid>
        </Grid>
      </form>
    </div>
  );
}
