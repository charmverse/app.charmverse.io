import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Collapse, Divider, Tooltip, IconButton, Stack, TextField } from '@mui/material';
import { PaymentMethod } from '@prisma/client';
import charmClient from 'charmClient';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import Switch from 'components/common/BoardEditor/focalboard/src/widgets/switch';
import CharmButton from 'components/common/Button';
import InputSearchBlockchain from 'components/common/form/InputSearchBlockchain';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import InputSearchReviewers from 'components/common/form/InputSearchReviewers';
import { InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';
import { CryptoCurrency, getChainById } from 'connectors';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { ApplicationWithTransactions } from 'lib/applications/interfaces';
import { countValidSubmissions } from 'lib/applications/shared';
import { AssignedBountyPermissions, BountyPermissions, UpdateableBountyFields } from 'lib/bounties';
import { TargetPermissionGroup } from 'lib/permissions/interfaces';
import debouncePromise from 'lib/utilities/debouncePromise';
import { isTruthy } from 'lib/utilities/types';
import { BountyWithDetails } from 'models';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BountyCreationData } from 'lib/bounties/interfaces';
import BountyPropertiesHeader from './components/BountyPropertiesHeader';
import BountyReviewers from './components/BountyReviewers';
import BountySlots from './components/BountySlots';
import BountySuggestionApproval from './components/BountySuggestionApproval';
import BountyApplicantForm from './components/BountyApplicantForm';
import BountyApplicantsTable from './components/BountyApplicantsTable';
import MissingPagePermissions from './components/MissingPagePermissions';

export default function BountyProperties (props: {
  readOnly?: boolean,
  bountyId: string | null,
  pageId: string,
  permissions: AssignedBountyPermissions | null,
  refreshBountyPermissions: (bountyId: string) => void
}) {
  const { bountyId, pageId, readOnly = false, permissions, refreshBountyPermissions } = props;
  const [paymentMethods] = usePaymentMethods();
  const { draftBounty, bounties, cancelDraftBounty, setBounties, updateBounty } = useBounties();
  const [availableCryptos, setAvailableCryptos] = useState<Array<string | CryptoCurrency>>([]);
  const [isShowingAdvancedSettings, setIsShowingAdvancedSettings] = useState(false);
  const bountyFromContext = bounties.find(b => b.id === bountyId);
  const [currentBounty, setCurrentBounty] = useState<(BountyCreationData & BountyWithDetails) | null>(null);
  const [capSubmissions, setCapSubmissions] = useState(currentBounty?.maxSubmissions !== null);
  const [space] = useCurrentSpace();
  const [user] = useUser();
  const { setPages, pages } = usePages();

  const bountyPermissions = permissions?.bountyPermissions || currentBounty?.permissions;

  const assignedRoleSubmitters = bountyPermissions?.submitter?.filter(p => p.group === 'role').map(p => p.id as string) ?? [];
  const selectedReviewerUsers = bountyPermissions?.reviewer?.filter(p => p.group === 'user').map(p => p.id as string) ?? [];
  const selectedReviewerRoles = bountyPermissions?.reviewer?.filter(p => p.group === 'role').map(p => p.id as string) ?? [];

  // Copied from BountyApplicantsTable
  const [applications, setListApplications] = useState<ApplicationWithTransactions[]>([]);
  async function refreshSubmissions () {
    if (bountyId) {
      const listApplicationsResponse = await charmClient.listApplications(bountyId);
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
      const createdBounty = await charmClient.createBounty(currentBounty);
      setBounties((_bounties) => [..._bounties, createdBounty]);
      setPages(_pages => ({ ..._pages,
        [pageId]: {
          ..._pages[pageId]!,
          bountyId: createdBounty.id
        }
      }));
      cancelDraftBounty();
    }
  }

  useEffect(() => {
    refreshSubmissions();
  }, [currentBounty]);

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
          <div className='octo-propertyname octo-propertyname--readonly'>
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
              value={currentBounty?.maxSubmissions}
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
      />
      <Stack flexDirection='row' justifyContent='space-between' gap={2} alignItems='center'>
        {readOnly && (
          <Stack mb={1} width='100%'>
            {bountyPermissions?.reviewer && bountyPermissions.reviewer.length > 0 && (
              <BountyReviewers
                bounty={currentBounty}
                permissions={bountyPermissions}
              />
            )}
            {/* Extra space so this looks like the focalboard properties */}
            {
                currentBounty.maxSubmissions && (
                  <>
                    <div style={{ marginTop: 2 }}></div>
                    <BountySlots
                      maxSubmissions={currentBounty.maxSubmissions}
                      validSubmissions={countValidSubmissions(currentBounty.applications)}
                    />
                  </>
                )
              }
          </Stack>
        )}
        {!readOnly && (
          <div
            className='octo-propertyrow'
            style={{
              height: 'fit-content',
              flexGrow: 1
            }}
          >
            <div className='octo-propertyname octo-propertyname--readonly'>
              <Button>Reviewer</Button>
            </div>
            <div>
              <InputSearchReviewers
                disabled={readOnly}
                readOnly={readOnly}
                value={bountyPermissions?.reviewer ?? []}
                disableCloseOnSelect={true}
                onChange={async (e, options) => {
                  const roles = options.filter(option => option.group === 'role');
                  const contributors = options.filter(option => option.group === 'user');
                  await applyBountyUpdates({
                    permissions: rollupPermissions({
                      assignedRoleSubmitters,
                      selectedReviewerRoles: roles.map(role => role.id),
                      selectedReviewerUsers: contributors.map(contributor => contributor.id),
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
      </Stack>

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
        permissions && currentBounty.createdBy !== user?.id && (
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
  selectedReviewerUsers: string[],
  selectedReviewerRoles: string[],
  assignedRoleSubmitters: string[],
  spaceId: string
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
