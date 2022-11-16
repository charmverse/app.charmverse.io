import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Collapse, Divider, IconButton, Stack, TextField, Tooltip } from '@mui/material';
import type { PaymentMethod } from '@prisma/client';
import type { CryptoCurrency } from 'connectors';
import { getChainById } from 'connectors';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import Switch from 'components/common/BoardEditor/focalboard/src/widgets/switch';
import CharmButton from 'components/common/Button';
import InputSearchBlockchain from 'components/common/form/InputSearchBlockchain';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import InputSearchReviewers from 'components/common/form/InputSearchReviewers';
import { InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useUser } from 'hooks/useUser';
import type { ApplicationWithTransactions } from 'lib/applications/interfaces';
import type { AssignedBountyPermissions, BountyPermissions, UpdateableBountyFields, BountyCreationData, BountyWithDetails } from 'lib/bounties';
import type { TargetPermissionGroup } from 'lib/permissions/interfaces';
import debouncePromise from 'lib/utilities/debouncePromise';
import { isTruthy } from 'lib/utilities/types';

import BountyApplicantForm from './components/BountyApplicantForm';
import BountyApplicantsTable from './components/BountyApplicantsTable';
import BountyPropertiesHeader from './components/BountyPropertiesHeader';
import { BountySignupButton } from './components/BountySignupButton';
import BountySuggestionApproval from './components/BountySuggestionApproval';
import MissingPagePermissions from './components/MissingPagePermissions';

export default function BountyProperties (props: {
  readOnly?: boolean;
  bountyId: string | null;
  pageId: string;
  permissions: AssignedBountyPermissions | null;
  refreshBountyPermissions: (bountyId: string) => void;
}) {
  const { bountyId, pageId, readOnly: parentReadOnly = false, permissions, refreshBountyPermissions } = props;
  const [paymentMethods] = usePaymentMethods();
  const { draftBounty, bounties, cancelDraftBounty, setBounties, updateBounty } = useBounties();
  const [availableCryptos, setAvailableCryptos] = useState<(string | CryptoCurrency)[]>(['ETH']);
  const [isShowingAdvancedSettings, setIsShowingAdvancedSettings] = useState(false);
  const bountyFromContext = bounties.find(b => b.id === bountyId);
  const [currentBounty, setCurrentBounty] = useState<(BountyCreationData & BountyWithDetails) | null>(null);

  const [capSubmissions, setCapSubmissions] = useState(currentBounty?.maxSubmissions !== null);
  const space = useCurrentSpace();
  const { user } = useUser();
  const { mutatePage, pages } = usePages();

  const router = useRouter();

  const isPublic = router.asPath.split('/')[1] === 'share';
  const readOnly = parentReadOnly || isPublic;

  const bountyPage = pages[pageId];

  const bountyPermissions = permissions?.bountyPermissions || currentBounty?.permissions;

  const assignedRoleSubmitters = bountyPermissions?.submitter?.filter(p => p.group === 'role').map(p => p.id as string) ?? [];
  const selectedReviewerUsers = bountyPermissions?.reviewer?.filter(p => p.group === 'user').map(p => p.id as string) ?? [];
  const selectedReviewerRoles = bountyPermissions?.reviewer?.filter(p => p.group === 'role').map(p => p.id as string) ?? [];

  // Copied from BountyApplicantsTable
  const [applications, setListApplications] = useState<ApplicationWithTransactions[]>([]);
  async function refreshSubmissions () {
    if (bountyId) {
      const listApplicationsResponse = await charmClient.bounties.listApplications(bountyId);
      setListApplications(listApplicationsResponse);
    }
  }

  function refreshCryptoList (chainId: number, rewardToken?: string) {

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
      setCurrentBounty((_currentBounty) => ({ ..._currentBounty as BountyWithDetails, rewardToken: rewardToken || nativeCurrency }));
    }
    return selectedChain?.nativeCurrency.symbol;
  }

  async function onNewPaymentMethod (paymentMethod: PaymentMethod) {
    if (paymentMethod.contractAddress) {
      await applyBountyUpdates({ chainId: paymentMethod.chainId, rewardToken: paymentMethod.contractAddress });
      refreshCryptoList(paymentMethod.chainId, paymentMethod.contractAddress);
    }
  }

  async function applyBountyUpdates (updates: Partial<UpdateableBountyFields>) {
    setCurrentBounty((_currentBounty) => ({ ..._currentBounty as BountyWithDetails, ...updates }));
    if (currentBounty?.id) {
      await updateBounty(currentBounty.id, updates);
    }
  }

  const updateBountyDebounced = debouncePromise(async (_bountyId: string, updates: Partial<UpdateableBountyFields>) => {
    updateBounty(_bountyId, updates);
  }, 2500);

  async function applyBountyUpdatesDebounced (updates: Partial<BountyWithDetails>) {
    setCurrentBounty((_currentBounty) => ({ ..._currentBounty as BountyWithDetails, ...updates }));
    if (bountyId) {
      updateBountyDebounced(bountyId, updates);
    }
  }

  const updateBountyAmount = useCallback((e) => {
    applyBountyUpdatesDebounced({
      rewardAmount: Number(e.target.value)
    });
  }, []);

  const updateBountyMaxSubmissions = useCallback((e) => {
    applyBountyUpdatesDebounced({
      maxSubmissions: Number(e.target.value)
    });
  }, []);

  async function confirmNewBounty () {
    if (currentBounty) {
      const createdBounty = await charmClient.bounties.createBounty(currentBounty);
      setBounties((_bounties) => [..._bounties, createdBounty]);
      mutatePage({ id: pageId, bountyId: createdBounty.id });
      cancelDraftBounty();
    }
  }

  useEffect(() => {
    if (currentBounty?.id) {
      refreshSubmissions();
    }
  }, [currentBounty?.id]);

  useEffect(() => {
    if (currentBounty?.chainId) {
      refreshCryptoList(currentBounty.chainId, currentBounty.rewardToken);
    }
  }, [currentBounty?.chainId, currentBounty?.rewardToken]);

  useEffect(() => {
    setCurrentBounty((draftBounty as BountyWithDetails) || bountyFromContext);
  }, [draftBounty, bountyFromContext]);

  const bountyPagePermissions = useMemo(() => {
    return pages[pageId]?.permissions;
  }, [pages[pageId]?.permissions]);

  const bountyProperties = (
    <>
      <div
        className='octo-propertyrow'
        style={{
          height: 'fit-content'
        }}
      >
        <div className='octo-propertyname octo-propertyname--readonly'>
          <Button>Chain</Button>
        </div>
        <InputSearchBlockchain
          disabled={readOnly}
          readOnly={readOnly}
          chainId={currentBounty?.chainId}
          sx={{
            width: '100%'
          }}
          onChange={async (chainId) => {
            const newNativeCurrency = refreshCryptoList(chainId);
            applyBountyUpdates({
              chainId,
              rewardToken: newNativeCurrency
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
          <Button>Reward token</Button>
        </div>
        <InputSearchCrypto
          disabled={readOnly}
          readOnly={readOnly}
          cryptoList={availableCryptos}
          chainId={currentBounty?.chainId}
          defaultValue={currentBounty?.rewardToken}
          value={currentBounty?.rewardToken}
          hideBackdrop={true}
          onChange={newToken => {
            applyBountyUpdates({
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
          <Button>Reward amount</Button>
        </div>
        <TextField
          required
          sx={{
            width: '100%'
          }}
          disabled={readOnly}
          value={currentBounty?.rewardAmount}
          type='number'
          size='small'
          onChange={updateBountyAmount}
          inputProps={{
            step: 0.000000001
          }}
        />
      </div>
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
          <Button>Advanced settings</Button>
        </div>
        <Tooltip title={isShowingAdvancedSettings ? 'Hide advanced settings' : 'Expand advanced settings'}>
          <IconButton
            size='small'
          >
            {isShowingAdvancedSettings ? <KeyboardArrowUpIcon fontSize='small' /> : <KeyboardArrowDownIcon fontSize='small' />}
          </IconButton>
        </Tooltip>
      </Stack>
      <Collapse in={isShowingAdvancedSettings} timeout='auto' unmountOnExit>
        <div className='octo-propertyrow'>
          <div className='octo-propertyname octo-propertyname--readonly'>
            <Button>Require applications</Button>
          </div>
          <Switch
            isOn={Boolean(currentBounty?.approveSubmitters)}
            onChanged={(isOn) => {
              applyBountyUpdates({
                approveSubmitters: isOn
              });
            }}
            disabled={readOnly}
            readOnly={readOnly}
          />
        </div>
        <div
          className='octo-propertyrow'
          style={{
            height: 'fit-content'
          }}
        >
          <div className='octo-propertyname octo-propertyname--readonly' style={{ alignSelf: 'baseline', paddingTop: 8 }}>
            <Button>Applicant role(s)</Button>
          </div>
          <div style={{ width: '100%' }}>
            <InputSearchRoleMultiple
              disableCloseOnSelect={true}
              fullWidth
              defaultValue={assignedRoleSubmitters}
              onChange={async (roleIds) => {
                await applyBountyUpdates({
                  permissions: rollupPermissions({
                    assignedRoleSubmitters: roleIds,
                    selectedReviewerRoles,
                    selectedReviewerUsers,
                    spaceId: space!.id
                  })
                });
                if (currentBounty?.id) {
                  await refreshBountyPermissions(currentBounty.id);
                }
              }}
              filter={{ mode: 'exclude', userIds: assignedRoleSubmitters }}
              showWarningOnNoRoles={true}
              disabled={readOnly}
              readOnly={readOnly}
              sx={{
                width: '100%'
              }}
            />
            {
              bountyPagePermissions && bountyPermissions && (
                <MissingPagePermissions target='submitter' bountyPermissions={bountyPermissions} pagePermissions={bountyPagePermissions} />
              )
            }
          </div>

        </div>
        <div
          className='octo-propertyrow'
          style={{
            height: 'fit-content'
          }}
        >
          <div className='octo-propertyname octo-propertyname--readonly'>
            <Button>Submission limit</Button>
          </div>
          <Switch
            isOn={capSubmissions}
            onChanged={(isOn) => {
              setCapSubmissions(isOn);
              applyBountyUpdates({
                maxSubmissions: isOn ? (currentBounty?.maxSubmissions ?? 1) : null
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
              <Button>Max submissions</Button>
            </div>
            <TextField
              required
              defaultValue={currentBounty?.maxSubmissions}
              type='number'
              size='small'
              inputProps={{ step: 1, min: 1 }}
              sx={{
                width: '100%'
              }}
              disabled={readOnly}
              onChange={updateBountyMaxSubmissions}
            />
          </div>
        )}
      </Collapse>
    </>
  );

  if (!currentBounty) {
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
      <BountyPropertiesHeader
        bounty={currentBounty}
        bountyPermissions={bountyPermissions}
        pagePermissions={bountyPagePermissions}
        pageId={pageId}
      />
      <Box justifyContent='space-between' gap={2} alignItems='center'>
        {!readOnly && (
          <div
            className='octo-propertyrow'
            style={{
              display: 'flex',
              height: 'fit-content',
              flexGrow: 1
            }}
          >
            <div className='octo-propertyname octo-propertyname--readonly' style={{ alignSelf: 'baseline', paddingTop: 12 }}>
              <Button>Reviewer</Button>
            </div>
            <div style={{ width: '100%' }}>
              <InputSearchReviewers
                disabled={readOnly}
                readOnly={readOnly}
                value={bountyPermissions?.reviewer ?? []}
                disableCloseOnSelect={true}
                onChange={async (e, options) => {
                  const roles = options.filter(option => option.group === 'role');
                  const members = options.filter(option => option.group === 'user');
                  await applyBountyUpdates({
                    permissions: rollupPermissions({
                      assignedRoleSubmitters,
                      selectedReviewerRoles: roles.map(role => role.id),
                      selectedReviewerUsers: members.map(member => member.id),
                      spaceId: space!.id
                    })
                  });
                  if (currentBounty?.id) {
                    await refreshBountyPermissions(currentBounty.id);
                  }
                }}
                excludedIds={[...selectedReviewerUsers, ...selectedReviewerRoles]}
                sx={{
                  width: '100%'
                }}
              />
              {
                bountyPagePermissions && bountyPermissions && (
                  <MissingPagePermissions target='reviewer' bountyPermissions={bountyPermissions} pagePermissions={bountyPagePermissions} />
                )
              }
            </div>
          </div>
        )}
      </Box>

      {!readOnly && bountyProperties}

      {draftBounty && (
        <Box display='flex' gap={2} my={2}>
          <CharmButton color='primary' onClick={confirmNewBounty}>
            Confirm new bounty
          </CharmButton>
          <CharmButton color='secondary' variant='outlined' onClick={cancelDraftBounty}>
            Cancel
          </CharmButton>
        </Box>
      )}

      <Divider
        sx={{
          my: 1
        }}
      />

      {// Bounty creator cannot apply to their own bounty
        permissions && !isPublic && currentBounty.createdBy !== user?.id && (
          <>
            <BountyApplicantForm
              bounty={currentBounty}
              submissions={applications}
              permissions={permissions}
              refreshSubmissions={refreshSubmissions}
            />
            <Divider
              sx={{
                my: 3
              }}
            />
          </>
        )
      }

      {
        isPublic && bountyPage && (
          <BountySignupButton bountyPage={bountyPage} />
        )
      }

      {permissions?.userPermissions?.review && currentBounty.status !== 'suggestion' && !draftBounty && (
        <BountyApplicantsTable
          bounty={currentBounty}
          permissions={permissions}
        />
      )}

      {permissions?.userPermissions?.review && currentBounty.status === 'suggestion' && currentBounty.createdBy !== user?.id && (
        <>
          <BountySuggestionApproval
            bounty={currentBounty}
          />
          <Divider
            sx={{
              my: 1
            }}
          />
        </>
      )}
    </Box>
  );
}

// utils

function rollupPermissions ({
  selectedReviewerUsers,
  selectedReviewerRoles,
  assignedRoleSubmitters,
  spaceId
}: {
  selectedReviewerUsers: string[];
  selectedReviewerRoles: string[];
  assignedRoleSubmitters: string[];
  spaceId: string;
}): Pick<BountyPermissions, 'reviewer' | 'submitter'> {
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
  const submitters: TargetPermissionGroup[] = assignedRoleSubmitters.length !== 0 ? assignedRoleSubmitters.map(uid => {
    return {
      group: 'role',
      id: uid
    };
  }) : [{
    id: spaceId,
    group: 'space'
  }];

  const permissionsToSend: Pick<BountyPermissions, 'reviewer' | 'submitter'> = {
    reviewer: reviewers,
    submitter: submitters
  };

  return permissionsToSend;
}
