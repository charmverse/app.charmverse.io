import { Box, Divider, Stack } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import debounce from 'lodash/debounce';
import { DateTime } from 'luxon';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useGetPermissions } from 'charmClient/hooks/permissions';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { SelectPreviewContainer } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { StyledFocalboardTextInput } from 'components/common/BoardEditor/components/properties/TextInput';
import type { GroupedRole } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import Switch from 'components/common/BoardEditor/focalboard/src/widgets/switch';
import { RewardApplicantForm } from 'components/rewards/components/RewardProperties/components/RewardApplicantForm/RewardApplicantForm';
import { RewardTokenProperty } from 'components/rewards/components/RewardProperties/components/RewardTokenProperty';
import { RewardTypeSelect } from 'components/rewards/components/RewardProperties/components/RewardTypeSelect';
import { CustomPropertiesAdapter } from 'components/rewards/components/RewardProperties/CustomPropertiesAdapter';
import type { RewardTokenDetails, RewardType } from 'components/rewards/components/RewardProperties/interfaces';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { useUser } from 'hooks/useUser';
import type { RewardFieldsProp, RewardPropertiesField } from 'lib/rewards/blocks/interfaces';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { Reward, RewardWithUsers } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import { isTruthy } from 'lib/utilities/types';

// import RewardApplicantsTable from './components/RewardApplicantsTable';
import { RewardPropertiesHeader } from './components/RewardPropertiesHeader';
import { RewardSignupButton } from './components/RewardSignupButton';

export function RewardProperties(props: {
  readOnly?: boolean;
  rewardId: string | null;
  pageId: string;
  pagePath: string;
  refreshRewardPermissions: (rewardId: string) => void;
}) {
  const { rewardId, pageId, readOnly: parentReadOnly = false, refreshRewardPermissions } = props;
  const { rewards, mutateRewards, updateReward, tempReward, setTempReward } = useRewards();
  const [currentReward, setCurrentReward] = useState<(RewardCreationData & RewardWithUsers) | null>();
  const { user } = useUser();

  const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false);

  /* TODO @Mo - permissions */
  const { data: rewardPermissions } = useSWR(rewardId ? `/rewards-${rewardId}` : null, () =>
    charmClient.rewards.computePermissions({
      resourceId: rewardId as string,
      userId: user?.id
    })
  );
  const { data: rewardPagePermissions, mutate: refreshPermissions } = useGetPermissions(pageId);
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

  useEffect(() => {
    const rewardFromContext = rewards?.find((r) => r.id === rewardId);
    setCurrentReward(rewardFromContext || (tempReward as RewardWithUsers));

    if (rewardFromContext && tempReward) {
      setTempReward(null);
    }
  }, [rewardId, rewards, setTempReward, tempReward]);

  const readOnly = parentReadOnly || !isSpaceMember;

  const { data: applications, mutate: refreshSubmissions } = useSWR(
    !rewardId ? null : `/rewards/${rewardId}/applications`,
    () => charmClient.rewards.listApplications(rewardId as string),
    {
      fallbackData: []
    }
  );

  async function applyRewardUpdates(updates: Partial<UpdateableRewardFields>) {
    setCurrentReward((_currentReward) => ({ ...(_currentReward as RewardWithUsers), ...updates }));
    if (currentReward?.id) {
      await updateReward({ rewardId: currentReward.id, updateContent: updates });
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
      const createdReward = await charmClient.rewards.createReward(currentReward);
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
          reward={currentReward}
          pageId={pageId}
          readOnly={readOnly}
          refreshPermissions={refreshPermissions}
        />

        <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
          <PropertyLabel readOnly highlighted>
            Reviewer
          </PropertyLabel>
          <UserAndRoleSelect
            readOnly={readOnly}
            value={currentReward.reviewers}
            onChange={async (options) => {
              await applyRewardUpdates({
                reviewers: options.map((option) => ({ group: option.group, id: option.id }))
              });

              if (currentReward?.id) {
                await refreshRewardPermissions(currentReward.id);
              }
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
                  approveSubmitters: isOn
                });
              }}
              disabled={readOnly}
              readOnly={readOnly}
            />
          </SelectPreviewContainer>
        </Box>

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

              if (currentReward?.id) {
                await refreshRewardPermissions(currentReward.id);
              }
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
            <RewardTokenProperty onChange={onRewardTokenUpdate} currentReward={currentReward} readOnly={readOnly} />
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
        {rewardPermissions?.work && isSpaceMember && currentReward.createdBy !== user?.id && (
          <div data-test='reward-applicant-form'>
            <RewardApplicantForm
              reward={currentReward}
              submissions={applications}
              permissions={rewardPermissions}
              refreshSubmissions={refreshSubmissions}
            />
          </div>
        )}

        {/*
      TODO - Fix this when we fix rewards table
      {rewardPermissions?.review &&
        currentReward.status !== 'suggestion' && ( // &&!draftReward
          <RewardApplicantsTable reward={currentReward} permissions={permissions} />
        )} */}
      </Stack>
    </Box>
  );
}

// utils - TODO - Fix this later when we check page permissions

// function rollupPermissions({
//   selectedReviewerUsers,
//   selectedReviewerRoles,
//   assignedRoleSubmitters,
//   spaceId
// }: {
//   selectedReviewerUsers: string[];
//   selectedReviewerRoles: string[];
//   assignedRoleSubmitters: string[];
//   spaceId: string;
// }): Pick<RewardPermissions, 'reviewer' | 'submitter'> {
//   const reviewers: RewardPermissions['reviewer'] = [
//     ...selectedReviewerUsers.map((uid) => {
//       return {
//         id: uid,
//         group: 'user' as const
//       };
//     }),
//     ...selectedReviewerRoles.map((uid) => {
//       return {
//         id: uid,
//         group: 'role' as const
//       };
//     })
//   ];
//   const submitters: RewardPermissions['submitter'] =
//     assignedRoleSubmitters.length !== 0
//       ? assignedRoleSubmitters.map((uid) => {
//           return {
//             group: 'role',
//             id: uid
//           };
//         })
//       : [
//           {
//             id: spaceId,
//             group: 'space'
//           }
//         ];

//   const permissionsToSend: Pick<RewardPermissions, 'reviewer' | 'submitter'> = {
//     reviewer: reviewers,
//     submitter: submitters
//   };

//   return permissionsToSend;
// }
