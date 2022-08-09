import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Collapse, Divider, Tooltip, IconButton, Stack, TextField } from '@mui/material';
import { PaymentMethod } from '@prisma/client';
import charmClient from 'charmClient';
import BountyHeader from 'components/bounties/components/BountyHeader';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import Switch from 'components/common/BoardEditor/focalboard/src/widgets/switch';
import InputSearchBlockchain from 'components/common/form/InputSearchBlockchain';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import InputSearchReviewers from 'components/common/form/InputSearchReviewers';
import { InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';
import { CryptoCurrency, getChainById } from 'connectors';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useUser } from 'hooks/useUser';
import { ApplicationWithTransactions } from 'lib/applications/interfaces';
import { countValidSubmissions } from 'lib/applications/shared';
import { AssignedBountyPermissions, BountyPermissions, UpdateableBountyFields } from 'lib/bounties';
import { TargetPermissionGroup } from 'lib/permissions/interfaces';
import debouncePromise from 'lib/utilities/debouncePromise';
import { isTruthy } from 'lib/utilities/types';
import { BountyWithDetails } from 'models';
import { useCallback, useEffect, useState } from 'react';
import BountyReviewers from './components/BountyReviewers';
import BountySlots from './components/BountySlots';
import BountySuggestionApproval from './components/BountySuggestionApproval';
import BountyApplicantForm from './components/BountyApplicantForm';
import BountyApplicantsTable from './components/BountyApplicantsTable';

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

export default function BountyProperties (props: {
  readOnly?: boolean,
  bounty: BountyWithDetails,
  permissions: AssignedBountyPermissions,
  refreshBountyPermissions: (bountyId: string) => void
}) {
  const { bounty, readOnly = false, permissions, refreshBountyPermissions } = props;
  const [paymentMethods] = usePaymentMethods();
  const { updateBounty } = useBounties();
  const [availableCryptos, setAvailableCryptos] = useState<Array<string | CryptoCurrency>>([]);
  const [isShowingAdvancedSettings, setIsShowingAdvancedSettings] = useState(false);
  const [currentBounty, setCurrentBounty] = useState<BountyWithDetails>(bounty);
  const [capSubmissions, setCapSubmissions] = useState(currentBounty.maxSubmissions !== null);
  const [space] = useCurrentSpace();
  const [user] = useUser();

  const assignedRoleSubmitters = permissions?.bountyPermissions?.submitter?.filter(p => p.group === 'role').map(p => p.id as string) ?? [];
  const selectedReviewerUsers = permissions?.bountyPermissions?.reviewer?.filter(p => p.group === 'user').map(p => p.id as string) ?? [];
  const selectedReviewerRoles = permissions?.bountyPermissions?.reviewer?.filter(p => p.group === 'role').map(p => p.id as string) ?? [];

  // Copied from BountyApplicantsTable
  const [applications, setListApplications] = useState<ApplicationWithTransactions[]>([]);
  async function refreshSubmissions () {
    if (bounty) {
      const listApplicationsResponse = await charmClient.listApplications(bounty.id);
      setListApplications(listApplicationsResponse);
    }
  }
  useEffect(() => {
    refreshSubmissions();
  }, [bounty]);
  // -----

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
      setCurrentBounty((_currentBounty) => ({ ..._currentBounty, rewardToken: rewardToken || nativeCurrency }));
    }
    return selectedChain?.nativeCurrency.symbol;
  }

  function onNewPaymentMethod (paymentMethod: PaymentMethod) {
    if (paymentMethod.contractAddress) {
      setCurrentBounty((_currentBounty) => ({ ..._currentBounty, chainId: paymentMethod.chainId }));
      refreshCryptoList(paymentMethod.chainId, paymentMethod.contractAddress);
    }
  }

  const debouncedBountyUpdate = debouncePromise(async (bountyId, updates: Partial<UpdateableBountyFields>) => {
    updateBounty(bountyId, updates);
  }, 2500);

  const updateBountyAmount = useCallback((e) => {
    setCurrentBounty((_currentBounty) => ({ ..._currentBounty,
      rewardAmount: Number(e.target.value)
    }));
    debouncedBountyUpdate(currentBounty.id, {
      rewardAmount: Number(e.target.value)
    });
  }, []);

  const updateBountyMaxSubmissions = useCallback((e) => {
    setCurrentBounty((_currentBounty) => ({ ..._currentBounty,
      maxSubmissions: Number(e.target.value)
    }));
    debouncedBountyUpdate(currentBounty.id, {
      maxSubmissions: Number(e.target.value)
    });
  }, []);

  useEffect(() => {

    refreshCryptoList(currentBounty.chainId, currentBounty.rewardToken);
  }, []);

  useEffect(() => {
    setCurrentBounty(bounty);
  }, [bounty]);

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
          chainId={currentBounty.chainId}
          sx={{
            width: '100%'
          }}
          onChange={async (chainId) => {
            const newNativeCurrency = refreshCryptoList(chainId);
            await updateBounty(currentBounty.id, {
              chainId,
              rewardToken: newNativeCurrency
            });
            setCurrentBounty((_currentBounty) => ({ ..._currentBounty, chainId }));
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
          value={currentBounty.rewardToken}
          hideBackdrop={true}
          onChange={newToken => {
            setCurrentBounty((_currentBounty) => ({ ..._currentBounty, rewardToken: newToken }));
            updateBounty(currentBounty.id, {
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
          value={currentBounty.rewardAmount}
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
            isOn={Boolean(currentBounty.approveSubmitters)}
            onChanged={(isOn) => {
              setCurrentBounty((_currentBounty) => ({ ..._currentBounty, approveSubmitters: isOn }));
              updateBounty(currentBounty.id, {
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
          <InputSearchRoleMultiple
            disableCloseOnSelect={true}
            defaultValue={assignedRoleSubmitters}
            onChange={async (roleIds) => {
              await updateBounty(currentBounty.id, {
                permissions: rollupPermissions({
                  assignedRoleSubmitters: roleIds,
                  selectedReviewerRoles,
                  selectedReviewerUsers,
                  spaceId: space!.id
                })
              });
              await refreshBountyPermissions(currentBounty.id);
            }}
            filter={{ mode: 'exclude', userIds: assignedRoleSubmitters }}
            showWarningOnNoRoles={true}
            disabled={readOnly}
            readOnly={readOnly}
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
            <Button>Submission limit</Button>
          </div>
          <Switch
            isOn={capSubmissions}
            onChanged={(isOn) => {
              setCapSubmissions(isOn);
              setCurrentBounty((_currentBounty) => ({ ..._currentBounty, maxSubmissions: isOn ? (_currentBounty.maxSubmissions ?? 1) : null }));
              updateBounty(currentBounty.id, {
                maxSubmissions: isOn ? (currentBounty.maxSubmissions ?? 1) : null
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
            value={currentBounty.maxSubmissions}
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

  return (
    <Box
      className='octo-propertylist CardDetailProperties'
      sx={{
        '& .MuiInputBase-input': {
          background: 'none'
        }
      }}
    >
      {bounty && (
        <>
          <hr />
          <BountyHeader
            bounty={bounty}
          />
        </>
      )}
      <Stack flexDirection='row' justifyContent='space-between' gap={2} alignItems='center'>
        {
          permissions && (readOnly ? (
            <Stack mb={1} width='100%'>
              {permissions?.bountyPermissions.reviewer.length > 0 && (
                <BountyReviewers
                  bounty={bounty}
                  permissions={permissions}
                />
              )}
              {/* Extra space so this looks like the focalboard properties */}
              {
                bounty.maxSubmissions && (
                  <>
                    <div style={{ marginTop: 2 }}></div>
                    <BountySlots
                      maxSubmissions={bounty.maxSubmissions}
                      validSubmissions={countValidSubmissions(bounty.applications)}
                    />
                  </>
                )
              }
            </Stack>
          ) : (
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
              <InputSearchReviewers
                disabled={readOnly}
                readOnly={readOnly}
                value={permissions?.bountyPermissions?.reviewer ?? []}
                disableCloseOnSelect={true}
                onChange={async (e, options) => {
                  const roles = options.filter(option => option.group === 'role');
                  const contributors = options.filter(option => option.group === 'user');
                  await updateBounty(currentBounty.id, {
                    permissions: rollupPermissions({
                      assignedRoleSubmitters,
                      selectedReviewerRoles: roles.map(role => role.id),
                      selectedReviewerUsers: contributors.map(contributor => contributor.id),
                      spaceId: space!.id
                    })
                  });
                  await refreshBountyPermissions(currentBounty.id);
                }}
                excludedIds={[...selectedReviewerUsers, ...selectedReviewerRoles]}
                sx={{
                  width: '100%'
                }}
              />
            </div>
          ))
        }
      </Stack>

      {!readOnly && bountyProperties}

      <Divider
        sx={{
          my: 1
        }}
      />

      {// Bounty creator cannot apply to their own bounty
        permissions && bounty.createdBy !== user?.id && (
          <>
            <BountyApplicantForm
              bounty={bounty}
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

      {permissions?.userPermissions?.review && bounty.status !== 'suggestion' && (
        <BountyApplicantsTable
          bounty={currentBounty}
          permissions={permissions}
        />
      )}

      {permissions?.userPermissions?.review && bounty.status === 'suggestion' && bounty.createdBy !== user?.id && (
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
