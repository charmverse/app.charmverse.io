import { Box, Divider, Stack, Tooltip } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import debounce from 'lodash/debounce';
import { DateTime } from 'luxon';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useGetPermissions } from 'charmClient/hooks/permissions';
import { useGetReward } from 'charmClient/hooks/rewards';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { SelectPreviewContainer } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { StyledFocalboardTextInput } from 'components/common/BoardEditor/components/properties/TextInput';
import type { GroupedRole } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import Switch from 'components/common/BoardEditor/focalboard/src/widgets/switch';
import { RewardTokenProperty } from 'components/rewards/components/RewardProperties/components/RewardTokenProperty';
import { RewardTypeSelect } from 'components/rewards/components/RewardProperties/components/RewardTypeSelect';
import { CustomPropertiesAdapter } from 'components/rewards/components/RewardProperties/CustomPropertiesAdapter';
import type { RewardTokenDetails, RewardType } from 'components/rewards/components/RewardProperties/interfaces';
import { useApplicationDialog } from 'components/rewards/hooks/useApplicationDialog';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { useUser } from 'hooks/useUser';
import type { RewardFieldsProp, RewardPropertiesField } from 'lib/rewards/blocks/interfaces';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { Reward, RewardWithUsers } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import { isTruthy } from 'lib/utilities/types';

// import RewardApplicantsTable from './components/RewardApplicantsTable';
import { RewardApplications } from '../RewardApplications/RewardApplications';

import { RewardPropertiesHeader } from './components/RewardPropertiesHeader';
import { RewardSignupButton } from './components/RewardSignupButton';

export function RewardProperties(props: {
  readOnly?: boolean;
  rewardId: string | null;
  pageId: string;
  pagePath: string;
}) {
  const { rewardId, pageId, readOnly: parentReadOnly = false } = props;
  const { mutateRewards, updateReward, refreshReward, tempReward, setTempReward } = useRewards();
  const [currentReward, setCurrentReward] = useState<Partial<RewardCreationData & RewardWithUsers> | null>();

  const { showApplication } = useApplicationDialog();

  const { data: initialReward } = useGetReward({
    rewardId: rewardId as string
  });

  useEffect(() => {
    if (!currentReward && initialReward) {
      setCurrentReward(initialReward as any);
    }
  }, [initialReward]);

  const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false);

  /* TODO @Mo - permissions */
  const { data: rewardPermissions } = useSWR(rewardId ? `/rewards-${rewardId}` : null, () =>
    charmClient.rewards.computeRewardPermissions({
      resourceId: rewardId as string
    })
  );
  const { data: rewardPagePermissions, mutate: refreshPagePermissionsList } = useGetPermissions(pageId);
  const [rewardType, setRewardType] = useState<RewardType>('Token');
  // Using ref to make sure we don't keep redirecting to custom reward tab
  const { isSpaceMember } = useIsSpaceMember();

  const allowedSubmittersValue: GroupedRole[] = (currentReward?.allowedSubmitterRoles ?? []).map((id) => ({
    id,
    group: 'role'
  }));

  useEffect(() => {
    if (isTruthy(currentReward?.customReward)) {
      setRewardType('Custom');
    }
  }, [currentReward?.customReward]);

  async function resyncReward() {
    const _rewardId = currentReward?.id;
    if (_rewardId) {
      const updated = await refreshReward(_rewardId);
      setCurrentReward({ ...currentReward, ...updated });
    }
  }

  const readOnly = parentReadOnly || !isSpaceMember || props.readOnly;

  const applications = currentReward?.applications;

  async function applyRewardUpdates(updates: Partial<UpdateableRewardFields>) {
    setCurrentReward((_currentReward) => ({ ...(_currentReward as RewardWithUsers), ...updates }));

    if (currentReward?.id) {
      await updateReward({ rewardId: currentReward.id, updateContent: updates });
      resyncReward();
    }
  }

  const updateRewardDebounced = useMemo(
    () =>
      debounce((_rewardId: string, updates: Partial<UpdateableRewardFields>) => {
        updateReward({ rewardId: _rewardId, updateContent: updates });
      }, 1000),
    []
  );

  async function onRewardTokenUpdate(rewardToken: RewardTokenDetails | null) {
    if (rewardToken) {
      await applyRewardUpdates({
        chainId: rewardToken.chainId,
        rewardToken: rewardToken.rewardToken,
        rewardAmount: Number(rewardToken.rewardAmount),
        customReward: null
      });
    }
  }

  async function applyRewardUpdatesDebounced(updates: Partial<UpdateableRewardFields>) {
    if ('customReward' in updates) {
      const customReward = updates.customReward;
      if (isTruthy(customReward)) {
        updates.rewardAmount = null;
        updates.chainId = null;
        updates.rewardToken = null;
      } else {
        updates.rewardAmount = 1;
        updates.chainId = 1;
        updates.rewardToken = 'ETH';
      }
    }

    setCurrentReward((_currentReward) => ({ ...(_currentReward as RewardWithUsers), ...updates }));
    if (rewardId) {
      updateRewardDebounced(rewardId, updates);
    }
  }

  const updateRewardCustomReward = useCallback((e: any) => {
    applyRewardUpdatesDebounced({
      customReward: e.target.value
    });
  }, []);

  const updateRewardMaxSubmissions = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const updatedValue = Number(e.target.value);

    applyRewardUpdatesDebounced({
      maxSubmissions: updatedValue <= 0 ? null : updatedValue
    });
  }, []);

  const updateRewardDueDate = useCallback((date: DateTime | null) => {
    applyRewardUpdatesDebounced({
      dueDate: date?.toJSDate() || undefined
    });
  }, []);

  // handling tempReward
  async function confirmNewReward() {
    if (currentReward) {
      const createdReward = await charmClient.rewards.createReward(currentReward as RewardCreationData);
      mutateRewards((_rewards = []) => [..._rewards, createdReward]);
    }
  }

  // useEffect(() => {
  //   if (currentReward?.id) {
  //     refreshSubmissions();
  //   }
  // }, [currentReward?.id]);

  if (!currentReward) {
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
          reward={currentReward as RewardWithUsers}
          pageId={pageId}
          readOnly={readOnly}
          refreshPermissions={refreshPagePermissionsList}
        />

        <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
          <PropertyLabel readOnly highlighted>
            Reviewer
          </PropertyLabel>
          <UserAndRoleSelect
            readOnly={readOnly}
            value={currentReward.reviewers ?? []}
            onChange={async (options) => {
              await applyRewardUpdates({
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
            value={currentReward?.dueDate}
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

          <SelectPreviewContainer readOnly={readOnly} displayType='details'>
            <Switch
              sx={{ ml: '0 !important' }}
              isOn={Boolean(currentReward?.approveSubmitters)}
              onChanged={(isOn) => {
                applyRewardUpdates({
                  approveSubmitters: !!isOn
                });
              }}
              disabled={readOnly}
              readOnly={readOnly}
            />
          </SelectPreviewContainer>
        </Box>

        <Tooltip placement='left' title='Allow the same user to participate in this reward more than once'>
          <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
            <PropertyLabel readOnly highlighted>
              Multiple submissions
            </PropertyLabel>

            <SelectPreviewContainer readOnly={readOnly} displayType='details'>
              <Switch
                sx={{ ml: '0 !important' }}
                isOn={Boolean(currentReward?.allowMultipleApplications)}
                onChanged={(isOn) => {
                  applyRewardUpdates({
                    allowMultipleApplications: !!isOn
                  });
                }}
                disabled={readOnly}
                readOnly={readOnly}
              />
            </SelectPreviewContainer>
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

              await applyRewardUpdates({
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
            defaultValue={currentReward?.maxSubmissions}
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
              currentReward={currentReward as (RewardCreationData & RewardWithUsers) | null}
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
              value={currentReward?.customReward ?? ''}
              required
              defaultValue={currentReward?.maxSubmissions}
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
          reward={currentReward as RewardWithUsers & RewardFieldsProp}
          onChange={(properties: RewardPropertiesField) => {
            applyRewardUpdates({
              fields: { properties: properties ? { ...properties } : {} } as Reward['fields']
            });
          }}
        />

        <Divider
          sx={{
            my: 1
          }}
        />

        {!isSpaceMember && <RewardSignupButton pagePath={props.pagePath} />}

        {rewardId && currentReward && applications && (
          <RewardApplications
            refreshReward={(_rewardId: string) =>
              refreshReward(_rewardId).then((updatedReward) => setCurrentReward(updatedReward))
            }
            reward={currentReward as RewardWithUsers}
            permissions={rewardPermissions}
            openApplication={showApplication}
          />
        )}
      </Stack>
    </Box>
  );
}
