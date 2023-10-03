import type { PaymentMethod } from '@charmverse/core/prisma';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Collapse, Divider, IconButton, Stack, TextField, Tooltip } from '@mui/material';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import type { CryptoCurrency } from 'connectors';
import { getChainById } from 'connectors';
import debounce from 'lodash/debounce';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useGetPermissions } from 'charmClient/hooks/permissions';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import ButtonBoard from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import Switch from 'components/common/BoardEditor/focalboard/src/widgets/switch';
import { InputSearchBlockchain } from 'components/common/form/InputSearchBlockchain';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import { InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useUser } from 'hooks/useUser';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import { isTruthy } from 'lib/utilities/types';

import RewardApplicantForm from './components/RewardApplicantForm';
// import RewardApplicantsTable from './components/RewardApplicantsTable';
import { RewardPropertiesHeader } from './components/RewardPropertiesHeader';
import { RewardSignupButton } from './components/RewardSignupButton';

const RewardTypes = ['Token', 'Custom'] as const;
type RewardType = (typeof RewardTypes)[number];

export function RewardProperties(props: {
  readOnly?: boolean;
  rewardId: string | null;
  pageId: string;
  pagePath: string;
  refreshRewardPermissions: (rewardId: string) => void;
}) {
  const { rewardId, pageId, readOnly: parentReadOnly = false, refreshRewardPermissions } = props;
  const [paymentMethods] = usePaymentMethods();
  const { rewards, mutateRewards, updateReward } = useRewards();
  const [availableCryptos, setAvailableCryptos] = useState<(string | CryptoCurrency)[]>(['ETH']);
  const [isShowingAdvancedSettings, setIsShowingAdvancedSettings] = useState(false);
  const [currentReward, setCurrentReward] = useState<(RewardCreationData & RewardWithUsers) | null>();
  const [isAmountInputEmpty, setIsAmountInputEmpty] = useState<boolean>(false);
  const [capSubmissions, setCapSubmissions] = useState(false);
  const { space } = useCurrentSpace();
  const { isFreeSpace } = useIsFreeSpace();
  const { user } = useUser();

  const { data: rewardPermissions } = useSWR(rewardId ? `/rewards-${rewardId}` : null, () =>
    charmClient.rewards.computePermissions({
      resourceId: rewardId as string,
      userId: user?.id
    })
  );

  const isRewardAmountInvalid = useMemo(
    () => isAmountInputEmpty || Number(currentReward?.rewardAmount) <= 0,
    [isAmountInputEmpty, currentReward]
  );
  const [autoTabSwitchDone, setAutoTabSwitchDone] = useState(false);

  const { data: rewardPagePermissions, mutate: refreshPermissions } = useGetPermissions(pageId);

  const [rewardType, setRewardType] = useState<RewardType>('Token');
  // Using ref to make sure we don't keep redirecting to custom reward tab
  const { isSpaceMember } = useIsSpaceMember();

  useEffect(() => {
    if (!autoTabSwitchDone && currentReward) {
      setAutoTabSwitchDone(true);
      if (rewardType !== 'Custom' && isTruthy(currentReward.customReward)) {
        setRewardType('Custom');
      }
    }
  }, [currentReward?.customReward, rewardType, autoTabSwitchDone]);

  useEffect(() => {
    if (currentReward) {
      setCapSubmissions(currentReward.maxSubmissions !== null);
    }
  }, [!!currentReward]);

  useEffect(() => {
    // TODO - handle draft rewards
    const rewardFromContext = rewards?.find((r) => r.id === rewardId);
    setCurrentReward(rewardFromContext /* || (draftReward as BountyWithDetails) */);
    // if (bountyFromContext && draftBounty) {
    //   cancelDraftBounty();
    // }
  }, [rewardId, rewards]);

  const readOnly = parentReadOnly || !isSpaceMember;

  const assignedRoleSubmitters = currentReward?.allowedSubmitterRoles;
  const selectedReviewerUsers = currentReward?.reviewers.filter((r) => r.group === 'role');
  const selectedReviewerRoles = currentReward?.reviewers.filter((r) => r.group === 'user');

  // Copied from RewardApplicantsTable
  const { data: applications, mutate: refreshSubmissions } = useSWR(
    !rewardId ? null : `/rewards/${rewardId}/applications`,
    () => charmClient.rewards.listApplications(rewardId as string),
    {
      fallbackData: []
    }
  );

  function refreshCryptoList(chainId: number, rewardToken?: string) {
    // Set the default chain currency
    const selectedChain = getChainById(chainId);

    if (selectedChain) {
      const nativeCurrency = selectedChain.nativeCurrency.symbol;

      const cryptosToDisplay = [nativeCurrency];

      const contractAddresses = paymentMethods
        .filter((method) => method.chainId === chainId)
        .map((method) => {
          return method.contractAddress;
        })
        .filter(isTruthy);
      cryptosToDisplay.push(...contractAddresses);

      setAvailableCryptos(cryptosToDisplay);
      setCurrentReward((_currentReward) => ({
        ...(_currentReward as RewardWithUsers),
        rewardToken: rewardToken || nativeCurrency
      }));
    }
    return selectedChain?.nativeCurrency.symbol;
  }

  async function onNewPaymentMethod(paymentMethod: PaymentMethod) {
    if (paymentMethod.contractAddress) {
      await applyRewardUpdates({ chainId: paymentMethod.chainId, rewardToken: paymentMethod.contractAddress });
      refreshCryptoList(paymentMethod.chainId, paymentMethod.contractAddress);
    }
  }

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

  const updateRewardAmount = useCallback((e: any) => {
    setIsAmountInputEmpty(e.target.value === '');

    applyRewardUpdatesDebounced({
      rewardAmount: Number(e.target.value)
    });
  }, []);

  const updateRewardCustomReward = useCallback((e: any) => {
    applyRewardUpdatesDebounced({
      customReward: e.target.value
    });
  }, []);

  const updateRewardMaxSubmissions = useCallback((e: any) => {
    applyRewardUpdatesDebounced({
      maxSubmissions: Number(e.target.value)
    });
  }, []);

  async function confirmNewReward() {
    if (currentReward) {
      const createdReward = await charmClient.rewards.createReward(currentReward);
      mutateRewards((_rewards = []) => [..._rewards, createdReward]);
    }
  }

  useEffect(() => {
    if (currentReward?.id) {
      refreshSubmissions();
    }
  }, [currentReward?.id]);

  useEffect(() => {
    if (currentReward?.chainId && currentReward.rewardToken) {
      refreshCryptoList(currentReward.chainId, currentReward.rewardToken);
    }
  }, [currentReward?.chainId, currentReward?.rewardToken]);

  const rewardProperties = (
    <>
      <div
        className='octo-propertyrow'
        style={{
          height: 'fit-content'
        }}
        data-test='reward-configuration'
      >
        <div
          className='octo-propertyname octo-propertyname--readonly'
          style={{
            alignSelf: 'center'
          }}
        >
          <ButtonBoard>Reward</ButtonBoard>
        </div>
        <Tabs
          indicatorColor={readOnly ? 'secondary' : 'primary'}
          value={RewardTypes.indexOf(rewardType)}
          onChange={async (_, newRewardType) => {
            setRewardType(RewardTypes[newRewardType]);
          }}
          aria-label='multi tabs'
          sx={{ minHeight: 0 }}
        >
          {RewardTypes.map((_rewardType) => (
            <Tab
              disabled={readOnly}
              sx={{
                textTransform: 'initial'
              }}
              key={_rewardType}
              label={_rewardType}
            />
          ))}
        </Tabs>
      </div>

      {rewardType === 'Token' && (
        <>
          <div
            className='octo-propertyrow'
            style={{
              height: 'fit-content'
            }}
          >
            <div className='octo-propertyname octo-propertyname--readonly'>
              <ButtonBoard>Chain</ButtonBoard>
            </div>
            <InputSearchBlockchain
              disabled={readOnly}
              readOnly={readOnly}
              chainId={currentReward?.chainId ?? undefined}
              sx={{
                width: '100%'
              }}
              onChange={(chainId) => {
                const newNativeCurrency = refreshCryptoList(chainId);
                applyRewardUpdates({
                  chainId,
                  rewardToken: newNativeCurrency,
                  rewardAmount: 1,
                  customReward: null
                });
              }}
            />
          </div>
          <div
            className='octo-propertyrow'
            style={{
              height: 'fit-content'
            }}
          >
            <div className='octo-propertyname octo-propertyname--readonly'>
              <ButtonBoard>Token</ButtonBoard>
            </div>
            <InputSearchCrypto
              disabled={readOnly || !isTruthy(currentReward?.chainId)}
              readOnly={readOnly}
              cryptoList={availableCryptos}
              chainId={currentReward?.chainId ?? undefined}
              defaultValue={currentReward?.rewardToken ?? undefined}
              value={currentReward?.rewardToken ?? undefined}
              hideBackdrop={true}
              onChange={(newToken) => {
                applyRewardUpdates({
                  rewardToken: newToken
                });
              }}
              onNewPaymentMethod={onNewPaymentMethod}
              sx={{
                width: '100%'
              }}
            />
          </div>

          <div
            className='octo-propertyrow'
            style={{
              height: 'fit-content'
            }}
          >
            <div className='octo-propertyname octo-propertyname--readonly'>
              <ButtonBoard>Amount</ButtonBoard>
            </div>
            <TextField
              data-test='reward-property-amount'
              sx={{
                width: '100%'
              }}
              disabled={readOnly || !isTruthy(currentReward?.chainId)}
              value={isAmountInputEmpty ? '' : currentReward?.rewardAmount ?? ''}
              type='number'
              size='small'
              onChange={updateRewardAmount}
              inputProps={{
                step: 0.01,
                style: { height: 'auto' }
              }}
              error={isRewardAmountInvalid}
              helperText={
                isTruthy(currentReward?.rewardAmount) &&
                isRewardAmountInvalid &&
                'Reward amount should be a number greater than 0'
              }
            />
          </div>
        </>
      )}

      {rewardType === 'Custom' && (
        <div
          className='octo-propertyrow'
          style={{
            height: 'fit-content',
            marginLeft: 155
          }}
        >
          <TextField
            sx={{
              width: '100%'
            }}
            disabled={readOnly}
            value={currentReward?.customReward ?? ''}
            type='text'
            size='small'
            multiline
            autoFocus
            rows={1}
            onChange={async (e) => {
              updateRewardCustomReward(e);
            }}
            placeholder='T-shirt'
          />
        </div>
      )}
      <Stack
        gap={0.5}
        flexDirection='row'
        alignItems='center'
        mt={2}
        onClick={() => {
          setIsShowingAdvancedSettings(!isShowingAdvancedSettings);
        }}
      >
        <div className='octo-propertyname octo-propertyname--readonly'>
          <ButtonBoard>Advanced settings</ButtonBoard>
        </div>
        <Tooltip title={isShowingAdvancedSettings ? 'Hide advanced settings' : 'Expand advanced settings'}>
          <IconButton size='small'>
            {isShowingAdvancedSettings ? (
              <KeyboardArrowUpIcon fontSize='small' />
            ) : (
              <KeyboardArrowDownIcon fontSize='small' />
            )}
          </IconButton>
        </Tooltip>
      </Stack>
      <Collapse in={isShowingAdvancedSettings} timeout='auto' unmountOnExit>
        <div className='octo-propertyrow'>
          <div className='octo-propertyname octo-propertyname--readonly'>
            <ButtonBoard>Require applications</ButtonBoard>
          </div>
          <Switch
            isOn={Boolean(currentReward?.approveSubmitters)}
            onChanged={(isOn) => {
              applyRewardUpdates({
                approveSubmitters: isOn
              });
            }}
            disabled={readOnly}
            readOnly={readOnly}
          />
        </div>
        {!isFreeSpace && (
          <div
            className='octo-propertyrow'
            style={{
              height: 'fit-content'
            }}
          >
            <div
              className='octo-propertyname octo-propertyname--readonly'
              style={{ alignSelf: 'baseline', paddingTop: 8 }}
            >
              <ButtonBoard>Applicant role(s)</ButtonBoard>
            </div>
            <div style={{ width: '100%' }}>
              <InputSearchRoleMultiple
                disableCloseOnSelect={true}
                fullWidth
                defaultValue={assignedRoleSubmitters ?? []}
                onChange={async () => {
                  if (currentReward?.id) {
                    await refreshRewardPermissions(currentReward.id);
                  }
                }}
                filterSelectedOptions={true}
                showWarningOnNoRoles={true}
                disabled={readOnly}
                readOnly={readOnly}
                sx={{
                  width: '100%'
                }}
              />

              {/* TODO - FIX later
              
              {rewardPagePermissions && rewardPermissions && (
                <MissingPagePermissions
                  target='submitter'
                  rewardPermissions={rewardPermissions}
                  pagePermissions={rewardPagePermissions}
                />
              )} */}
            </div>
          </div>
        )}

        <div
          className='octo-propertyrow'
          style={{
            height: 'fit-content'
          }}
        >
          <div className='octo-propertyname octo-propertyname--readonly'>
            <ButtonBoard>Submission limit</ButtonBoard>
          </div>
          <Switch
            isOn={capSubmissions}
            onChanged={(isOn) => {
              setCapSubmissions(isOn);
              applyRewardUpdates({
                maxSubmissions: isOn ? currentReward?.maxSubmissions ?? 1 : null
              });
            }}
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>
        {capSubmissions && (
          <div
            className='octo-propertyrow'
            style={{
              height: 'fit-content'
            }}
          >
            <div className='octo-propertyname octo-propertyname--readonly'>
              <ButtonBoard>Max submissions</ButtonBoard>
            </div>
            <TextField
              required
              defaultValue={currentReward?.maxSubmissions}
              type='number'
              size='small'
              inputProps={{ step: 1, min: 1, style: { height: 'auto' } }}
              sx={{
                width: '100%'
              }}
              disabled={readOnly}
              onChange={updateRewardMaxSubmissions}
            />
          </div>
        )}
      </Collapse>
    </>
  );

  if (!currentReward) {
    return null;
  }

  return (
    <Box
      className='octo-propertylist'
      sx={{
        '& .MuiInputBase-input': {
          background: 'none'
        }
      }}
      mt={2}
    >
      <Divider />
      <RewardPropertiesHeader
        reward={currentReward}
        pageId={pageId}
        readOnly={readOnly}
        refreshPermissions={refreshPermissions}
      />
      <Box justifyContent='space-between' gap={2} alignItems='center'>
        <div
          className='octo-propertyrow'
          style={{
            display: 'flex',
            height: 'fit-content',
            flexGrow: 1
          }}
        >
          <div className='octo-propertyname octo-propertyname--readonly' style={{ alignSelf: 'baseline' }}>
            <ButtonBoard>Reviewer</ButtonBoard>
          </div>
          <UserAndRoleSelect
            readOnly={readOnly}
            value={currentReward.reviewers}
            variant='outlined'
            onChange={async (options) => {
              const roles = options.filter((option) => option.group === 'role');
              const members = options.filter((option) => option.group === 'user');
              await applyRewardUpdates({
                allowedSubmitterRoles: roles.map((r) => r.id)
              });
              if (currentReward?.id) {
                await refreshRewardPermissions(currentReward.id);
              }
            }}
          />
          {/* {rewardPagePermissions && rewardPermissions && (
            <MissingPagePermissions
              target='reviewer'
              rewardPermissions={rewardPermissions}
              pagePermissions={rewardPagePermissions}
            />
          )} */}
        </div>
      </Box>

      {rewardProperties}

      {/* {draftReward && !rewardFromContext && (
        <Box display='flex' gap={2} my={2}>
          <Button color='primary' onClick={confirmNewReward}>
            Confirm new reward
          </Button>
          <Button color='secondary' variant='outlined' onClick={cancelDraftReward}>
            Cancel
          </Button>
        </Box>
      )} */}

      <Divider
        sx={{
          my: 1
        }}
      />
      {/* 
      {
        TODO - Replace this with a way to create your own application. We could just use the application input form
        // Reward creator cannot apply to their own reward
        permissions && isSpaceMember && currentReward.createdBy !== user?.id && (
          <div data-test='reward-applicant-form'>
            <RewardApplicantForm
              reward={currentReward}
              submissions={applications}
              permissions={permissions}
              refreshSubmissions={refreshSubmissions}
            />
            <Divider
              sx={{
                my: 3
              }}
            />
          </div>
        )
      } */}

      {!isSpaceMember && <RewardSignupButton pagePath={props.pagePath} />}
      {/*
      TODO - Fix this when we fix rewards table
      {rewardPermissions?.review &&
        currentReward.status !== 'suggestion' && ( // &&!draftReward
          <RewardApplicantsTable reward={currentReward} permissions={permissions} />
        )} */}
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
