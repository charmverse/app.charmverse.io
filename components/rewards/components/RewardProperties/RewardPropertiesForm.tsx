import { Box, Collapse, Divider, Stack, Tooltip } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import debounce from 'lodash/debounce';
import { DateTime } from 'luxon';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { StyledFocalboardTextInput } from 'components/common/BoardEditor/components/properties/TextInput';
import type { GroupedRole } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import Checkbox from 'components/common/BoardEditor/focalboard/src/widgets/checkbox';
import { ExpandableSection } from 'components/common/ExpandableSection';
import { RewardPropertiesHeader } from 'components/rewards/components/RewardProperties/components/RewardPropertiesHeader';
import { RewardTokenProperty } from 'components/rewards/components/RewardProperties/components/RewardTokenProperty';
import { RewardTypeSelect } from 'components/rewards/components/RewardProperties/components/RewardTypeSelect';
import { CustomPropertiesAdapter } from 'components/rewards/components/RewardProperties/CustomPropertiesAdapter';
import type { RewardTokenDetails, RewardType } from 'components/rewards/components/RewardProperties/interfaces';
import type { RewardFieldsProp, RewardPropertiesField } from 'lib/rewards/blocks/interfaces';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { Reward, RewardWithUsers } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import { isTruthy } from 'lib/utilities/types';

type Props = {
  onChange: (values: Partial<UpdateableRewardFields>) => void;
  values: UpdateableRewardFields;
  readOnly?: boolean;
  // only needed for saving existing reward
  useDebouncedInputs?: boolean;
  pageId?: string;
  refreshPermissions?: VoidFunction;
};

export function RewardPropertiesForm({
  onChange,
  values,
  readOnly,
  useDebouncedInputs,
  pageId,
  refreshPermissions
}: Props) {
  const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [rewardType, setRewardType] = useState<RewardType>('Token');
  const allowedSubmittersValue: GroupedRole[] = (values?.allowedSubmitterRoles ?? []).map((id) => ({
    id,
    group: 'role'
  }));

  useEffect(() => {
    if (isTruthy(values?.customReward)) {
      setRewardType('Custom');
    }
  }, [values?.customReward]);

  async function applyUpdates(updates: Partial<UpdateableRewardFields>) {
    if ('customReward' in updates) {
      const customReward = updates.customReward;
      if (isTruthy(customReward)) {
        updates.rewardAmount = null;
        updates.chainId = null;
        updates.rewardToken = null;
      } else {
        updates.rewardAmount = updates.rewardAmount || 1;
        updates.chainId = updates.chainId || 1;
        updates.rewardToken = updates.rewardToken || 'ETH';
      }
    }

    onChange(updates);
  }

  const applyUpdatesDebounced = useMemo(() => {
    if (useDebouncedInputs) {
      return debounce((updates: Partial<UpdateableRewardFields>) => {
        applyUpdates(updates);
      }, 1000);
    }

    return applyUpdates;
  }, [useDebouncedInputs]);

  async function onRewardTokenUpdate(rewardToken: RewardTokenDetails | null) {
    if (rewardToken) {
      await applyUpdates({
        chainId: rewardToken.chainId,
        rewardToken: rewardToken.rewardToken,
        rewardAmount: Number(rewardToken.rewardAmount),
        customReward: null
      });
    }
  }

  const updateRewardCustomReward = useCallback((e: any) => {
    applyUpdatesDebounced({
      customReward: e.target.value
    });
  }, []);

  const updateRewardMaxSubmissions = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const updatedValue = Number(e.target.value);

    applyUpdatesDebounced({
      maxSubmissions: updatedValue <= 0 ? null : updatedValue
    });
  }, []);

  const updateRewardDueDate = useCallback((date: DateTime | null) => {
    applyUpdatesDebounced({
      dueDate: date?.toJSDate() || undefined
    });
  }, []);

  if (!values) {
    return null;
  }

  return (
    <Box
      className='CardDetail content'
      sx={{
        '& .MuiInputBase-input': {
          background: 'none'
        },
        '.octo-propertyname .Button': {
          paddingLeft: '0 !important'
        },
        display: 'flex',
        flex: 1,
        mt: 0
      }}
      mt={2}
    >
      <Stack className='octo-propertylist' mt={2} flex={1}>
        <Divider />

        <RewardPropertiesHeader
          reward={values as RewardWithUsers}
          pageId={pageId || ''}
          isExpanded={isExpanded}
          toggleExpanded={() => setIsExpanded((v) => !v)}
          readOnly={readOnly || !pageId}
          refreshPermissions={refreshPermissions || (() => {})}
        />

        <Collapse in={isExpanded} timeout='auto' unmountOnExit>
          <>
            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted>
                Reviewer
              </PropertyLabel>
              <UserAndRoleSelect
                readOnly={readOnly}
                value={values.reviewers ?? []}
                onChange={async (options) => {
                  await applyUpdates({
                    reviewers: options.map((option) => ({ group: option.group, id: option.id }))
                  });
                }}
              />
            </Box>

            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted>
                Due date
              </PropertyLabel>

              <DateTimePicker
                minDate={DateTime.fromMillis(Date.now())}
                value={values?.dueDate}
                disableMaskedInput
                disabled={readOnly}
                onAccept={async (value) => {
                  updateRewardDueDate(value);
                }}
                onChange={(value) => {
                  updateRewardDueDate(value);
                }}
                renderInput={(_props) => (
                  <StyledFocalboardTextInput
                    {..._props}
                    inputProps={{
                      ..._props.inputProps,
                      readOnly: true,
                      className: 'Editable octo-propertyvalue',
                      placeholder: 'Empty'
                    }}
                    fullWidth
                    onClick={() => {
                      setIsDateTimePickerOpen((v) => !v);
                    }}
                    placeholder='Empty'
                  />
                )}
                onClose={() => setIsDateTimePickerOpen(false)}
                open={isDateTimePickerOpen}
              />
            </Box>

            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted>
                Application required
              </PropertyLabel>

              <Checkbox
                isOn={Boolean(values?.approveSubmitters)}
                onChanged={(isOn) => {
                  applyUpdates({
                    approveSubmitters: !!isOn
                  });
                }}
                disabled={readOnly}
                readOnly={readOnly}
              />
            </Box>

            <Tooltip placement='left' title='Allow the same user to participate in this reward more than once'>
              <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                <PropertyLabel readOnly highlighted>
                  Allow multiple entries
                </PropertyLabel>

                <Checkbox
                  isOn={Boolean(values?.allowMultipleApplications)}
                  onChanged={(isOn) => {
                    applyUpdates({
                      allowMultipleApplications: !!isOn
                    });
                  }}
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </Box>
            </Tooltip>

            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted>
                Applicant Roles
              </PropertyLabel>
              <UserAndRoleSelect
                type='role'
                readOnly={readOnly}
                value={allowedSubmittersValue}
                onChange={async (options) => {
                  const roleIds = options.filter((option) => option.group === 'role').map((option) => option.id);

                  await applyUpdates({
                    allowedSubmitterRoles: roleIds
                  });
                }}
              />
              {/* TODO @Mo - FIX later
              {rewardPagePermissions && rewardPermissions && (
                <MissingPagePermissions
                  target='submitter'
                  rewardPermissions={rewardPermissions}
                  pagePermissions={rewardPagePermissions}
                />
              )} */}
            </Box>

            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted>
                # of Rewards Available
              </PropertyLabel>
              <StyledFocalboardTextInput
                onChange={updateRewardMaxSubmissions}
                required
                defaultValue={values?.maxSubmissions}
                type='number'
                size='small'
                inputProps={{ step: 1, min: 1, style: { height: 'auto' }, className: 'Editable octo-propertyvalue' }}
                sx={{
                  width: '100%'
                }}
                disabled={readOnly}
                placeholder='Unlimited'
              />
            </Box>

            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted>
                Reward Type
              </PropertyLabel>
              <RewardTypeSelect readOnly={readOnly} value={rewardType} onChange={setRewardType} />
            </Box>

            {rewardType === 'Token' && (
              <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                <PropertyLabel readOnly highlighted>
                  Reward Token
                </PropertyLabel>
                <RewardTokenProperty
                  onChange={onRewardTokenUpdate}
                  currentReward={values as (RewardCreationData & RewardWithUsers) | null}
                  readOnly={readOnly}
                />
              </Box>
            )}

            {rewardType === 'Custom' && (
              <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                <PropertyLabel readOnly highlighted>
                  Custom Reward
                </PropertyLabel>

                <StyledFocalboardTextInput
                  onChange={updateRewardCustomReward}
                  value={values?.customReward ?? ''}
                  required
                  defaultValue={values?.maxSubmissions}
                  size='small'
                  inputProps={{ style: { height: 'auto' }, className: 'Editable octo-propertyvalue' }}
                  sx={{
                    width: '100%'
                  }}
                  disabled={readOnly}
                  placeholder='T-shirt'
                  autoFocus
                  rows={1}
                  type='text'
                />
              </Box>
            )}

            <CustomPropertiesAdapter
              readOnly={readOnly}
              reward={values as RewardWithUsers & RewardFieldsProp}
              onChange={(properties: RewardPropertiesField) => {
                applyUpdates({
                  fields: { properties: properties ? { ...properties } : {} } as Reward['fields']
                });
              }}
            />
          </>
        </Collapse>
      </Stack>
    </Box>
  );
}
