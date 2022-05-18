import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
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
  maxSubmissions: yup.number().typeError('Amount must be a number greater than 1').test({
    message: 'Amount must be a number greater than 1',
    test: (value, context) => {

      // eslint-disable-next-line no-restricted-globals
      const isNum = typeof value === 'number' && !isNaN(value);

      if (context.parent.capSubmissions === true && (!isNum || value < 1)) {
        return false;
      }
      return true;
    }
  }),
  setExpiryDate: yup.boolean(),
  expiryDate: yup.mixed().test({
    message: 'Expiry date is required',
    test: (value, context) => {
      if (context.parent.setExpiryDate === true && !value) {
        return false;
      }
      return true;
    }
  })
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

  const [space] = useCurrentSpace();
  const [user] = useUser();
  const [paymentMethods] = usePaymentMethods();

  const [availableCryptos, setAvailableCryptos] = useState<Array<string | CryptoCurrency>>([]);

  const chainId = watch('chainId');
  const rewardToken = watch('rewardToken');

  useEffect(() => {
    refreshCryptoList(defaultChainId, bounty?.rewardToken);

    // Revalidate form on load
    if (mode === 'update') {
      trigger();
    }
  }, []);

  async function submitted (value: FormValues & Bounty) {

    if (!value.setExpiryDate) {
      value.expiryDate = null;
    }

    if (!value.capSubmissions) {
      delete value.maxSubmissions;
    }
    delete value.capSubmissions;

    if (mode === 'create') {
      delete value.setExpiryDate;

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
      const updates: Partial<Bounty> = {
        updatedAt: new Date(),
        title: value.title,
        rewardAmount: value.rewardAmount,
        rewardToken: value.rewardToken,
        descriptionNodes: value.descriptionNodes,
        description: value.description,
        reviewer: value.reviewer,
        chainId: value.chainId,
        //
        approveSubmitters: value.approveSubmitters === null ? undefined : value.approveSubmitters,
        capSubmissions: value.capSubmissions === null ? undefined : value.capSubmissions,
        maxSubmissions: value.capSubmissions === false ? null : value.maxSubmissions,
        expiryDate: value.setExpiryDate ? value.expiryDate : null

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
      <form onSubmit={handleSubmit(val => submitted(val as any))} style={{ margin: 'auto' }}>
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
            <Grid item xs={6}>
              <FormControlLabel
                label='Require applications'
                control={(
                  <Switch
                    onChange={(event) => {
                      setValue('approveSubmitters', event.target.checked === true, {
                        shouldValidate: true
                      });
                    }}
                    defaultChecked={values.approveSubmitters}
                  />
                )}
              />

            </Grid>
            <Grid item xs={6}>
              <Typography variant='body2'>
                {
                values.approveSubmitters

                  ? 'Workspace members will have to apply to work on this bounty. They will be able to submit work once their application is accepted.'

                  : 'Any workspace member can make a submission to this bounty.'

              }
              </Typography>

            </Grid>
          </Grid>
          <Grid container item>

            <Grid item xs={6}>

              <FormControlLabel
                label='Limit amount of submissions'
                control={(
                  <Switch
                    onChange={(event) => {
                      setValue('capSubmissions', event.target.checked === true, {
                        shouldValidate: true
                      });
                    }}
                    defaultChecked={values.approveSubmitters}
                  />
                )}
              />

            </Grid>

            <Grid item xs={6}>

              {
                values.capSubmissions === true && (
                  <TextField
                    {...register('maxSubmissions', {
                      valueAsNumber: true
                    })}
                    fullWidth
                    focused={focusKey === 'maxSubmissions'}
                    type='number'
                    size='small'
                    error={!!errors?.maxSubmissions}
                    helperText={errors?.maxSubmissions?.message}
                    inputProps={{ step: 1, min: 1 }}
                  />
                )
              }

            </Grid>
          </Grid>

          <Grid container item>
            <Grid item xs={6}>
              <FormControlLabel
                label='Set expiry date'
                control={(
                  <Switch
                    onChange={(event) => {
                      setValue('setExpiryDate', event.target.checked === true, {
                        shouldValidate: true
                      });
                    }}
                    defaultChecked={values.setExpiryDate || values.expiryDate}
                  />
                )}
              />

            </Grid>

            <Grid item xs={6}>
              {
              values.setExpiryDate ? (
                <>
                  <InputLabel>Expiry date</InputLabel>
                  <DatePicker
                    value={values.expiryDate}
                    onChange={(value) => {
                      setValue('expiryDate', value, {
                        shouldValidate: true
                      });
                    }}
                    renderInput={(props) => (
                      <TextField
                        fullWidth
                        name='expiryDate'
                        {...props}
                        error={!!errors.expiryDate}
                        helperText={errors?.expiryDate?.message}
                      />
                    )}
                  />
                </>
              ) : (
                <Typography variant='body2'>
                  {
                        values.approveSubmitters ? 'Workspace members can apply to this bounty until the bounty closes.' : 'Workspace members can make new submissions for this bounty until the bounty closes.'
                      }
                </Typography>
              )
                    }
            </Grid>
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
