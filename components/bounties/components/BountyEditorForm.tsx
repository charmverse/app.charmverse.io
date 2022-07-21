import { yupResolver } from '@hookform/resolvers/yup';
import { ButtonProps } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import { InputSearchContributorMultiple } from 'components/common/form/InputSearchContributor';
import { InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';
import SelectMenu, { MenuOption } from 'components/common/Menu';
import { CryptoCurrency, getChainById } from 'connectors';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useUser } from 'hooks/useUser';
import { BountyCreationData, BountySubmitterPoolSize, UpdateableBountyFields } from 'lib/bounties/interfaces';
import { AssignedBountyPermissions, BountyPermissions, BountySubmitter, inferBountyPermissionsMode } from 'lib/permissions/bounties/client';
import { TargetPermissionGroup } from 'lib/permissions/interfaces';
import { SystemError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';
import { BountyWithDetails, PageContent } from 'models';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

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
  onCancel?: ButtonProps['onClick']
}

export default function BountyEditorForm ({ onCancel, onSubmit, bounty, mode = 'create', focusKey, permissions: receivedPermissions }: IBountyEditorInput) {
  const { setBounties, bounties, updateBounty } = useBounties();
  const defaultChainId = bounty?.chainId ?? 1;

  const [userSpacePermissions] = useCurrentSpacePermissions();

  const [user] = useUser();
  const [space] = useCurrentSpace();

  const [bountyApplicantPool, setBountyApplicantPool] = useState<BountySubmitterPoolSize | null>(null);

  const [permissions] = useState<Partial<BountyPermissions>>(receivedPermissions?.bountyPermissions ?? {});

  useEffect(() => {
    if (bounty) {
      setBountyApplicantPool(null);
      refreshBountyApplicantPool();
    }

  }, [bounty, permissions]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors }
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      rewardToken: 'ETH',
      // TBC till we agree on Prisma migration
      chainId: defaultChainId,
      maxSubmissions: 1,
      approveSubmitters: true,
      capSubmissions: !((bounty && bounty?.maxSubmissions === null)),
      // expiryDate: null,
      ...(bounty || {}),
      description: bounty?.description,
      descriptionNodes: bounty?.descriptionNodes
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

  const [submitterMode, setSubmitterMode] = useState<BountySubmitter>(inferBountyPermissionsMode(permissions ?? {})?.mode ?? 'space');
  const [assignedRoleSubmitters, setAssignedRoleSubmitters] = useState<Array<string>>(permissions?.submitter?.filter(p => p.group === 'role').map(p => p.id as string) ?? []);

  const [selectedReviewerUsers, setSelectedReviewerUsers] = useState<string[]>(
    permissions?.reviewer?.filter(r => r.group === 'user').map(r => r.id as string) ?? []
  );
  const [selectedReviewerRoles, setSelectedReviewerRoles] = useState<string[]>(
    permissions?.reviewer?.filter(r => r.group === 'role').map(r => r.id as string) ?? []
  );

  async function refreshBountyApplicantPool (): Promise<void> {
    const updatedPermissions = rollupPermissions();
    const calculation = await charmClient.getBountyApplicantPool({
      permissions: updatedPermissions
    });
    setBountyApplicantPool(calculation);

    if (calculation.mode === 'space') {
      setSubmitterMode('space');
    }

    if (calculation.mode === 'role') {
      setSubmitterMode('role');
    }
  }

  useEffect(() => {
    refreshBountyApplicantPool();
  }, [submitterMode, assignedRoleSubmitters, selectedReviewerUsers, selectedReviewerRoles]);

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

    // Not using this field anymore
    if (value.reviewer) {
      value.reviewer = null;
    }

    const permissionsToSet = rollupPermissions();

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
      value.linkedTaskId = bounty?.linkedTaskId ?? null;
      (value as BountyCreationData).permissions = permissionsToSet;
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

      (value as BountyCreationData).permissions = permissionsToSet;
      const createdBounty = await charmClient.createBounty(value);
      const populatedBounty = { ...createdBounty, applications: [] };
      setBounties([...bounties, populatedBounty]);

      onSubmit(populatedBounty);
    }

  }

  return (
    <div>
      <form onSubmit={handleSubmit(val => submitted(val as any))} style={{ margin: 'auto' }}>
        <Grid container direction='column' spacing={3}>
          {
            mode !== 'suggest' && userSpacePermissions?.createBounty && (
              <>

                <Grid item xs>
                  <InputLabel>
                    Reviewers
                  </InputLabel>
                </Grid>
                <Grid item xs>
                  <InputSearchContributorMultiple
                    defaultValue={selectedReviewerUsers}
                    disableCloseOnSelect={true}
                    onChange={setSelectedReviewerUsers}
                    filter={
                      {
                        mode: 'exclude',
                        userIds: selectedReviewerUsers
                      }
                    }
                  />
                </Grid>
                <Grid item xs>
                  <InputSearchRoleMultiple
                    disableCloseOnSelect={true}
                    defaultValue={selectedReviewerRoles}
                    onChange={setSelectedReviewerRoles}
                    filter={{ mode: 'exclude', userIds: selectedReviewerRoles }}
                  />
                </Grid>
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
                {
                  (submitterMode === 'space' || (submitterMode === 'role' && assignedRoleSubmitters.length > 0)) && (
                    <Grid item xs={12}>
                      <Typography display='block' justifyContent='center'>

                        {submitterMode === 'space' && (
                          values?.approveSubmitters
                            ? 'All workspace members can apply to work on this bounty.' : 'All workspace members can submit work to this bounty.'
                        )}

                        {submitterMode === 'role' && assignedRoleSubmitters.length > 0
                      && bountyApplicantPool && (
                          `There ${
                            bountyApplicantPool.total === 1 ? 'is' : 'are'
                          } ${bountyApplicantPool.total} workspace member${bountyApplicantPool.total !== 1 ? 's' : ''} who can ${values?.approveSubmitters ? 'apply' : 'submit work'} to this bounty.`
                        )}

                      </Typography>

                    </Grid>
                  )
                }

                {
                  submitterMode === 'role' && (
                    <Grid item xs={12}>
                      <InputSearchRoleMultiple
                        disableCloseOnSelect={true}
                        defaultValue={assignedRoleSubmitters}
                        onChange={setAssignedRoleSubmitters}
                        filter={{ mode: 'exclude', userIds: assignedRoleSubmitters }}
                        showWarningOnNoRoles={true}
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
              </>
            )
          }
        </Grid>
      </form>
    </div>
  );
}
