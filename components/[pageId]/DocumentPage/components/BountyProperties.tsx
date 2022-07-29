import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Collapse, Divider, FormLabel, IconButton, Stack, TextField } from '@mui/material';
import { PaymentMethod } from '@prisma/client';
import charmClient from 'charmClient';
import BountyStatusBadge from 'components/bounties/components/BountyStatusBadge';
import BountySuggestionApproval from 'components/bounties/components/BountySuggestionApproval';
import BountyHeader from 'components/bounties/components/BountyHeader';
import BountyReviewers from 'components/bounties/[bountyId]/components_v3/BountyReviewers';
import BountySubmissionsTable from 'components/bounties/components/BountySubmissionsTable';
import Switch from 'components/common/BoardEditor/focalboard/src/widgets/switch';
import InputSearchBlockchain from 'components/common/form/InputSearchBlockchain';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import InputSearchReviewers from 'components/common/form/InputSearchReviewers';
import { InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';
import { CryptoCurrency, getChainById } from 'connectors';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useIsAdmin from 'hooks/useIsAdmin';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useUser } from 'hooks/useUser';
import { AssignedBountyPermissions, BountyPermissions, UpdateableBountyFields } from 'lib/bounties';
import { TargetPermissionGroup } from 'lib/permissions/interfaces';
import debouncePromise from 'lib/utilities/debouncePromise';
import { isTruthy } from 'lib/utilities/types';
import { BountyWithDetails } from 'models';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';

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

export default function BountyProperties (props: {children: ReactNode, readOnly?: boolean, bounty: BountyWithDetails}) {
  const { bounty, readOnly = false, children } = props;
  const [paymentMethods] = usePaymentMethods();
  const { updateBounty } = useBounties();
  const [availableCryptos, setAvailableCryptos] = useState<Array<string | CryptoCurrency>>([]);
  const [isShowingAdvancedSettings, setIsShowingAdvancedSettings] = useState(false);
  const [currentBounty, setCurrentBounty] = useState<BountyWithDetails>(bounty);
  const [capSubmissions, setCapSubmissions] = useState(currentBounty.maxSubmissions !== null);
  const [space] = useCurrentSpace();
  const [user] = useUser();
  const isAdmin = useIsAdmin();
  const [permissions, setPermissions] = useState<AssignedBountyPermissions | null>(null);
  const assignedRoleSubmitters = permissions?.bountyPermissions?.submitter?.filter(p => p.group === 'role').map(p => p.id as string) ?? [];
  const selectedReviewerUsers = permissions?.bountyPermissions?.reviewer?.filter(p => p.group === 'user').map(p => p.id as string) ?? [];
  const selectedReviewerRoles = permissions?.bountyPermissions?.reviewer?.filter(p => p.group === 'role').map(p => p.id as string) ?? [];

  const canEdit = user && !readOnly && ((bounty.createdBy === user.id && bounty.status !== 'suggestion') || (bounty.status === 'suggestion' && isAdmin) || isAdmin);

  async function refreshBountyPermissions (bountyId: string) {
    setPermissions(await charmClient.computeBountyPermissions({
      resourceId: bountyId
    }));
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
    refreshBountyPermissions(currentBounty.id);
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
        <div className='octo-propertyname'>
          <Button>Chain</Button>
        </div>
        <InputSearchBlockchain
          disabled={!canEdit}
          readOnly={!canEdit}
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
        <div className='octo-propertyname'>
          <Button>Token</Button>
        </div>
        <InputSearchCrypto
          disabled={!canEdit}
          readOnly={!canEdit}
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
        <div className='octo-propertyname'>
          <Button>Amount</Button>
        </div>
        <TextField
          required
          sx={{
            width: '100%'
          }}
          disabled={!canEdit}
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
        mt={2}
        onClick={() => {
          setIsShowingAdvancedSettings(!isShowingAdvancedSettings);
        }}
      >
        <FormLabel sx={{
          fontWeight: 500
        }}
        >Advanced Settings
        </FormLabel>
        <IconButton
          size='small'
          sx={{
            top: -2.5,
            position: 'relative'
          }}
        >
          {isShowingAdvancedSettings ? <KeyboardArrowUpIcon fontSize='small' /> : <KeyboardArrowDownIcon fontSize='small' />}
        </IconButton>
      </Stack>
      <Collapse in={isShowingAdvancedSettings} timeout='auto' unmountOnExit>
        <div className='octo-propertyrow'>
          <div className='octo-propertyname'>
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
            disabled={!canEdit}
            readOnly={!canEdit}
          />
        </div>
        <div
          className='octo-propertyrow'
          style={{
            height: 'fit-content'
          }}
        >
          <div className='octo-propertyname'>
            <Button>Applicant Role(s)</Button>
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
            disabled={!canEdit}
            readOnly={!canEdit}
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
          <div className='octo-propertyname'>
            <Button>Submissions limit</Button>
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
            readOnly={!canEdit}
            disabled={!canEdit}
          />
        </div>
        {capSubmissions && (
        <div
          className='octo-propertyrow'
          style={{
            height: 'fit-content'
          }}
        >
          <div className='octo-propertyname'>
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
            disabled={!canEdit}
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
      {permissions && (user?.id === bounty.createdBy || isAdmin) && (
      <BountyHeader
        bounty={bounty}
        permissions={permissions}
      />
      )}
      <Stack flexDirection='row' justifyContent='space-between' gap={2} alignItems='center'>
        {
          (permissions && !permissions.userPermissions?.review) ? (
            <BountyReviewers
              bounty={bounty}
              permissions={permissions}
            />
          ) : (
            <div
              className='octo-propertyrow'
              style={{
                height: 'fit-content',
                flexGrow: 1
              }}
            >
              <div className='octo-propertyname'>
                <Button>Reviewer</Button>
              </div>
              <InputSearchReviewers
                disabled={!canEdit}
                readOnly={!canEdit}
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
          )
        }
      </Stack>

      {canEdit && bountyProperties}

      <Divider
        sx={{
          my: 1
        }}
      />
      {children}
      {permissions && bounty.status !== 'suggestion' && (
      <>
        <BountySubmissionsTable
          bounty={currentBounty}
          permissions={permissions}
        />
        <Divider
          sx={{
            my: 1
          }}
        />
      </>
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
