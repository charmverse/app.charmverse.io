import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Bounty, PaymentMethod } from '@prisma/client';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import CharmEditor, { ICharmEditorOutput, UpdatePageContent } from 'components/common/CharmEditor/CharmEditor';
import InputSearchBlockchain from 'components/common/form/InputSearchBlockchain';
import { InputSearchContributor } from 'components/common/form/InputSearchContributor';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import { InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';
import SelectMenu, { MenuOption } from 'components/common/Menu';
import { CryptoCurrency, getChainById } from 'connectors';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useUser } from 'hooks/useUser';
import { BountyPermissions, AssignedBountyPermissions, BountySubmitter, InferredBountyPermissionMode, inferBountyPermissionsMode } from 'lib/permissions/bounties/client';
import { SystemError } from 'lib/utilities/errors';
import { typedKeys } from 'lib/utilities/objects';
import { isTruthy } from 'lib/utilities/types';
import { BountyWithDetails, PageContent } from 'models';
import { useEffect, useState } from 'react';
import { useForm, UseFormWatch } from 'react-hook-form';
import * as yup from 'yup';
import { TargetPermissionGroup } from 'lib/permissions/interfaces';
import { BountyCreationData } from 'lib/bounties/interfaces';

export type FormMode = 'create' | 'update' | 'suggest';

export const bountyFormTitles: Record<FormMode, string> = {
  create: 'Create bounty',
  update: 'Edit bounty',
  suggest: 'Suggest bounty'
};

export const schema = yup.object({
  title: yup.string().required('Please enter a title'),
  rewardAmount: yup.number(),
  rewardToken: yup.string().required(),
  descriptionNodes: yup.mixed(),
  description: yup.string(),
  reviewer: yup.string().nullable(true),
  chainId: yup.number().required(),
  // New fields
  approveSubmitters: yup.boolean(),
  capSubmissions: yup.boolean(),
  maxSubmissions: yup.number().nullable().typeError('Amount must be a number greater than 0').test({
    message: 'Amount must be a number greater than 0',
    test: (value, context) => {

      // eslint-disable-next-line no-restricted-globals
      const isNum = typeof value === 'number' && !isNaN(value);

      if (context.parent.capSubmissions === true && (!isNum || value < 1)) {
        return false;
      }
      return true;
    }
  })
  // setExpiryDate: yup.boolean(),
  // expiryDate: yup.mixed().test({
  //   message: 'Expiry date is required',
  //   test: (value, context) => {
  //     if (context.parent.setExpiryDate === true && !value) {
  //       return false;
  //     }
  //     return true;
  //   }
  // })
});

export type FormValues = yup.InferType<typeof schema>

const submitterMenuOptions: MenuOption<BountySubmitter>[] = [{
  value: 'space',
  primary: 'Workspace',
  secondary: 'All workspace members can work on this bounty'
}, {
  value: 'role',
  primary: 'Specific roles',
  secondary: 'Only members with specific roles can work on this bounty'
}];

/**
 * @focusKey The field that should be focused on popup. The underlying field should be using a native MUI field for this to work
 */
interface IBountyEditorInput {
  onSubmit: (bounty: BountyWithDetails) => any,
  mode?: FormMode
  bounty?: Partial<Bounty>
  permissions?: AssignedBountyPermissions
  focusKey?: keyof FormValues
}

// This component was created to localize the state change of CharmEditor
// Otherwise watching inside its parent would've caused the whole component tree to rerender
function FormDescription ({ onContentChange, content, watch }:
  {content?: PageContent, onContentChange: UpdatePageContent, watch: UseFormWatch<FormValues>}) {
  watch(['description', 'descriptionNodes']);

  return (
    <Grid
      item
      sx={{
        '&.MuiGrid-item': {
          maxWidth: '100%'
        }
      }}
    >
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

export default function BountyEditorForm ({ onSubmit, bounty, mode = 'create', focusKey, permissions }: IBountyEditorInput) {
  const { setBounties, bounties, updateBounty } = useBounties();

  const defaultChainId = bounty?.chainId ?? 1;

  const [userSpacePermissions] = useCurrentSpacePermissions();

  const [user] = useUser();
  const [space] = useCurrentSpace();

  // Cached description for when user is creating or suggesting a new bounty
  const [cachedBountyDescription, setCachedBountyDescription] = useLocalStorage<{nodes: PageContent, text: string}>(`newBounty.${space?.id}`, {
    nodes: {
      type: 'doc'
    },
    text: ''
  });
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
      capSubmissions: !((bounty && bounty?.maxSubmissions === null)),
      // expiryDate: null,
      ...(bounty || {}),
      description: bounty?.description ?? cachedBountyDescription.text,
      descriptionNodes: bounty?.descriptionNodes ?? cachedBountyDescription.nodes
      //      setExpiryDate: !!bounty?.expiryDate
    },
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    if (focusKey) {
      trigger(focusKey);
    }
  }, [focusKey]);

  const values = watch();

  const [paymentMethods] = usePaymentMethods();

  const [availableCryptos, setAvailableCryptos] = useState<Array<string | CryptoCurrency>>([]);
  const [formError, setFormError] = useState<SystemError | null>(null);

  const [inferredPermissionsMode, setInferredPermissionsMode] = useState<InferredBountyPermissionMode>(
    inferBountyPermissionsMode(permissions?.bountyPermissions ?? {})
  );

  const [submitterMode, setSubmitterMode] = useState<BountySubmitter>(inferredPermissionsMode.mode);
  const [assignedRoleSubmitters, setAssignedRoleSubmitters] = useState<Array<string>>(permissions ? (inferredPermissionsMode.roles ?? []) : []);

  const [selectedReviewerUsers, setSelectedReviewerUsers] = useState<string[]>([]);
  const [selectedReviewerRoles, setSelectedReviewerRoles] = useState<string[]>([]);

  const chainId = watch('chainId');
  const rewardToken = watch('rewardToken');

  useEffect(() => {
    refreshCryptoList(defaultChainId, bounty?.rewardToken);

    // Revalidate form on load
    if (mode === 'update') {
      trigger();
    }
  }, []);

  // Combines current states to generate what we'll send to the API
  function rollupPermissions (): Pick<BountyPermissions, 'reviewer' | 'submitter'> {

    const reviewers = [
      ...selectedReviewerUsers.map(uid => {
        return {
          id: uid,
          group: 'user'
        } as TargetPermissionGroup;
      }),
      ...selectedReviewerRoles.map(uid => {
        return {
          id: uid,
          group: 'role'
        } as TargetPermissionGroup;
      })
    ];
    //    }), ...selectedReviewerRoles];

    const submitters: TargetPermissionGroup[] = submitterMode === 'role' ? assignedRoleSubmitters.map(uid => {
      return {
        group: 'role',
        id: uid
      };
    }) : [{
      id: space?.id,
      group: 'space'
    }];

    const permissionsToSend: Pick<BountyPermissions, 'reviewer' | 'submitter'> = {
      reviewer: reviewers,
      submitter: submitters
    };

    return permissionsToSend;
  }

  async function submitted (value: FormValues & Bounty) {

    setFormError(null);

    const permissionsToSet = rollupPermissions();

    try {
      // if (!value.setExpiryDate) {
      //   value.expiryDate = null;
      // }

      if (!value.capSubmissions) {
        // Ensures any existing limit will be nulled
        value.maxSubmissions = null;
      }
      delete value.capSubmissions;

      if (mode === 'create') {
        // delete value.setExpiryDate;

        value.spaceId = space!.id;
        value.createdBy = user!.id;
        value.description = value.description ?? '';
        value.descriptionNodes = value.descriptionNodes ?? '';
        value.status = 'open';

        (value as BountyCreationData).permissions = permissionsToSet;
        const createdBounty = await charmClient.createBounty(value);
        const populatedBounty = { ...createdBounty, applications: [] };
        setBounties([...bounties, populatedBounty]);
        setCachedBountyDescription({
          nodes: {
            type: 'doc'
          },
          text: ''
        });
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

        (value as BountyCreationData).permissions = permissionsToSet;
        const createdBounty = await charmClient.createBounty(value);
        const populatedBounty = { ...createdBounty, applications: [] };
        setBounties([...bounties, populatedBounty]);

        setCachedBountyDescription({
          nodes: {
            type: 'doc'
          },
          text: ''
        });

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
          maxSubmissions: value.capSubmissions === false ? null : value.maxSubmissions
          // expiryDate: value.setExpiryDate ? value.expiryDate : null

        };

        const updatedBounty = await updateBounty(bounty.id, updates);
        onSubmit(updatedBounty);
      }
    }
    catch (err) {
      setFormError(err as SystemError);
    }

  }

  function setRichContent (content: ICharmEditorOutput) {
    setValue('descriptionNodes', content.doc);
    setValue('description', content.rawText);

    if (!bounty) {
      setCachedBountyDescription({
        nodes: content.doc,
        text: content.rawText
      });
    }
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
//            content={bounty?.descriptionNodes as PageContent ?? cachedBountyDescription.nodes as PageContent}
            content={values.descriptionNodes}
            onContentChange={setRichContent}
          />

          {
            mode !== 'suggest' && userSpacePermissions?.createBounty && (
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

                <hr />

                {/* New options */}

                <Grid container item xs={12}>
                  <Grid item xs={8}>
                    <Typography variant='h6'>
                      Who can work on this bounty
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <SelectMenu
                      selectedValue={submitterMode}
                      valueUpdated={(value) => setSubmitterMode(value as BountySubmitter)}
                      options={submitterMenuOptions}
                    />
                  </Grid>

                </Grid>
                <Grid item xs={12}>
                  <Typography display='block' justifyContent='center'>
                    {submitterMode === 'space' && values.approveSubmitters && (
                    // Insert intelligent rollup here
                      'All workspace members can apply to work on this bounty.'
                    )}
                    {submitterMode === 'space' && !values.approveSubmitters && (
                      'All workspace members can submit work to this bounty.'
                    )}
                    {submitterMode === 'role' && assignedRoleSubmitters.length === 0 && (
                      'Select a first role you want to allow to work on this bounty.'
                    )}
                    {submitterMode === 'role' && !values.approveSubmitters && assignedRoleSubmitters.length > 0 && (
                    // Isert intelligent rollup here
                      'Only workspace members with the one of the selected roles can submit work to this bounty.'
                    )}
                    {submitterMode === 'role' && values.approveSubmitters && assignedRoleSubmitters.length > 0 && (
                    // Isert intelligent rollup here
                      'Only workspace members with the one of the selected roles can apply to work on this bounty.'
                    )}

                  </Typography>

                </Grid>

                {
                  submitterMode === 'role' && (
                    <Grid item xs={12}>
                      <InputSearchRoleMultiple
                        disableCloseOnSelect={true}
                        defaultValue={assignedRoleSubmitters}
                        onChange={setAssignedRoleSubmitters}
                        filter={{ mode: 'exclude', userIds: assignedRoleSubmitters }}
                      />
                    </Grid>
                  )
                }

                <Grid item xs={12}>
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

                <Grid item xs={12} sx={{ pt: '2px !important' }}>
                  <Typography variant='body2' sx={{ ml: '8%' }}>
                    When enabled, a workspace Admin or the Bounty Reviewer must explicitly approve each user's application to this bounty.
                  </Typography>

                </Grid>

                <Grid container item xs={12}>
                  <Grid item xs={6}>
                    <FormControlLabel
                      label='Set submissions limit'
                      control={(
                        <Switch
                          onChange={(event) => {
                            const newValue = event.target.checked === true;
                            setValue('capSubmissions', newValue, {
                              shouldValidate: true
                            });

                            // eslint-disable-next-line no-restricted-globals
                            if (newValue === false && isNaN(values.maxSubmissions as any)) {
                              setValue('maxSubmissions', null, {
                                shouldValidate: true
                              });
                            }
                          }}
                          defaultChecked={values.capSubmissions}
                        />
              )}
                    />
                  </Grid>
                  <Grid item xs={6}>

                    {
                values.capSubmissions && (
                  <TextField
                    {...register('maxSubmissions', {
                      valueAsNumber: true,
                      setValueAs: (value) => {
                        // eslint-disable-next-line no-restricted-globals
                        if (isNaN(value)) {
                          return null;
                        }
                        return value;
                      }
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
                <Grid item xs={12} sx={{ pt: '2px !important' }}>
                  <Typography variant='body2' sx={{ ml: '8%' }}>
                    When enabled, limits the amount of active submissions for this bounty.
                  </Typography>

                </Grid>
              </>
            )
          }

          {
            formError && (
              <Grid item xs={12} sx={{ pt: '2px !important' }}>
                <Alert severity={formError.severity}>
                  {formError.message}
                </Alert>
              </Grid>
            )
          }

          <Grid item>
            <Button
              loading={isSubmitting}
              disabled={(mode === 'suggest' && (!values.title || !values.description)) || !isValid || (submitterMode === 'role' && assignedRoleSubmitters.length === 0)}
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
