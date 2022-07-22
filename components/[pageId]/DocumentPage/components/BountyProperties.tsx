import { useTheme } from '@emotion/react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Chip, Divider, FormLabel, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { Application, Bounty, PaymentMethod } from '@prisma/client';
import charmClient from 'charmClient';
import BountyStatusBadge from 'components/bounties/components/BountyStatusBadge';
import { ApplicationEditorForm } from 'components/bounties/[bountyId]/components/ApplicationEditorForm';
import { BountyApplicantList } from 'components/bounties/[bountyId]/components/BountyApplicantList';
import { SubmissionStatusColors, SubmissionStatusLabels } from 'components/bounties/[bountyId]/components_v3/BountySubmissions';
import BountySubmissionForm from 'components/bounties/[bountyId]/components_v3/SubmissionEditorForm';
import Switch from 'components/common/BoardEditor/focalboard/src/widgets/switch';
import Button from 'components/common/Button';
import InputSearchBlockchain from 'components/common/form/InputSearchBlockchain';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import InputSearchReviewers from 'components/common/form/InputSearchReviewers';
import { InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';
import UserDisplay from 'components/common/UserDisplay';
import { CryptoCurrency, getChainById } from 'connectors';
import { useBounties } from 'hooks/useBounties';
import { useContributors } from 'hooks/useContributors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useUser } from 'hooks/useUser';
import { AssignedBountyPermissions, BountyPermissions, UpdateableBountyFields } from 'lib/bounties';
import { TargetPermissionGroup } from 'lib/permissions/interfaces';
import { humanFriendlyDate } from 'lib/utilities/dates';
import debouncePromise from 'lib/utilities/debouncePromise';
import { isTruthy } from 'lib/utilities/types';
import { BountyWithDetails } from 'models';
import { useCallback, useEffect, useState } from 'react';

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

interface UserBountySubmissionTableProps {
  submission: Application
  bounty: Bounty
}

function UserBountySubmissionTable ({ bounty, submission }: UserBountySubmissionTableProps) {
  const theme = useTheme();
  const [contributors] = useContributors();
  const [isShowingSubmissionDetails, setIsShowingSubmissionDetails] = useState(false);
  const [isShowingSubmissionForm, setIsShowingSubmissionForm] = useState(false);

  return (
    <>
      <Table stickyHeader sx={{ minWidth: 650 }} aria-label='bounty applicant table'>
        <TableHead sx={{
          background: theme.palette.background.dark,
          '.MuiTableCell-root': {
            background: theme.palette.settingsHeader.background
          }
        }}
        >
          <TableRow>
            {/* Width should always be same as Bounty Applicant list status column, so submitter and applicant columns align */}
            <TableCell>
              <Box sx={{
                display: 'flex',
                alignItems: 'center'
              }}
              >
                Submitter
              </Box>
            </TableCell>
            <TableCell sx={{ width: 120 }} align='left'>
              Status
            </TableCell>
            <TableCell>
              Last updated
            </TableCell>
            <TableCell align='center'>
              Action
            </TableCell>
            <TableCell align='center'>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableCell size='small'>
            {(() => {
              const contributor = contributors.find(c => c.id === submission.createdBy);

              if (contributor) {
                return (
                  <UserDisplay
                    avatarSize='small'
                    user={contributor}
                    fontSize='small'
                    linkToProfile
                  />
                );
              }
              return 'Anonymous';
            })()}
          </TableCell>
          <TableCell size='small' align='left'>
            <Box display='flex' gap={1}>
              <Chip
                label={SubmissionStatusLabels[submission.status]}
                color={SubmissionStatusColors[submission.status]}
              />
            </Box>
          </TableCell>
          <TableCell>{ humanFriendlyDate(submission.updatedAt, { withTime: true })}</TableCell>
          <TableCell align='center' sx={{ gap: 2, justifyContent: 'flex-end' }}>
            <Button
              disabled={submission.status !== 'inProgress'}
              onClick={() => {
                setIsShowingSubmissionForm(true);
              }}
            >
              {submission.status === 'inProgress' ? 'Submit' : 'Awaiting approval'}
            </Button>
          </TableCell>
          <TableCell align='center' sx={{ gap: 2, justifyContent: 'flex-end' }}>
            <IconButton
              size='small'
              onClick={() => {
                setIsShowingSubmissionDetails(!isShowingSubmissionDetails);
              }}
            >
              {!isShowingSubmissionDetails ? <KeyboardArrowDownIcon fontSize='small' /> : <KeyboardArrowUpIcon fontSize='small' />}
            </IconButton>
          </TableCell>
        </TableBody>
      </Table>
      {isShowingSubmissionForm && (
      <Stack gap={1} my={2}>
        <FormLabel sx={{
          fontWeight: 'bold'
        }}
        >Submission
        </FormLabel>
        <BountySubmissionForm
          bounty={bounty}
          onSubmit={() => {}}
          onCancel={() => {
            setIsShowingSubmissionForm(false);
          }}
        />
      </Stack>
      )}
    </>
  );
}

export default function BountyProperties (props: {readOnly?: boolean, bounty: BountyWithDetails}) {
  const { bounty, readOnly = false } = props;
  const [paymentMethods] = usePaymentMethods();
  const { updateBounty } = useBounties();
  const [availableCryptos, setAvailableCryptos] = useState<Array<string | CryptoCurrency>>([]);
  const [isShowingAdvancedSettings, setIsShowingAdvancedSettings] = useState(false);
  const [currentBounty, setCurrentBounty] = useState<BountyWithDetails>(bounty);
  const [capSubmissions, setCapSubmissions] = useState(currentBounty.maxSubmissions !== null);
  const [space] = useCurrentSpace();
  const [user] = useUser();
  const [permissions, setPermissions] = useState<AssignedBountyPermissions | null>(null);
  const assignedRoleSubmitters = permissions?.bountyPermissions?.submitter?.filter(p => p.group === 'role').map(p => p.id as string) ?? [];
  const selectedReviewerUsers = permissions?.bountyPermissions?.reviewer?.filter(p => p.group === 'user').map(p => p.id as string) ?? [];
  const selectedReviewerRoles = permissions?.bountyPermissions?.reviewer?.filter(p => p.group === 'role').map(p => p.id as string) ?? [];
  const [isApplyingBounty, setIsApplyingBounty] = useState(false);
  const canEdit = !readOnly && permissions?.userPermissions.edit;
  const userApplication = currentBounty.applications.find(application => application.createdBy === user?.id);

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
        <div className='octo-propertyname'>Chain</div>
        <InputSearchBlockchain
          disabled={!canEdit}
          readOnly={!canEdit}
          chainId={currentBounty.chainId}
          sx={{
            width: 250
          }}
          onChange={async (chainId) => {
            const newNativeCurrency = refreshCryptoList(currentBounty.chainId);
            await updateBounty(currentBounty.id, {
              chainId: currentBounty.chainId,
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
        <div className='octo-propertyname'>Token</div>
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
            width: 250
          }}
        />
      </div>

      <div
        className='octo-propertyrow'
        style={{
          height: 'fit-content'
        }}
      >
        <div className='octo-propertyname'>Amount</div>
        <TextField
          required
          sx={{
            width: 250
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
      <Stack gap={0.5} flexDirection='row' mt={2}>
        <FormLabel sx={{
          fontWeight: 500
        }}
        >Advanced Settings
        </FormLabel>
        <IconButton
          size='small'
          onClick={() => {
            setIsShowingAdvancedSettings(!isShowingAdvancedSettings);
          }}
          sx={{
            top: -2.5,
            position: 'relative'
          }}
        >
          {isShowingAdvancedSettings ? <KeyboardArrowUpIcon fontSize='small' /> : <KeyboardArrowDownIcon fontSize='small' />}
        </IconButton>
      </Stack>
      {isShowingAdvancedSettings && (
      <>
        <div className='octo-propertyrow'>
          <div className='octo-propertyname'>Require applications</div>
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
          <div className='octo-propertyname'>Applicant Role(s)</div>
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
          />
        </div>
        <div className='octo-propertyrow'>
          <div className='octo-propertyname'>Submissions limit</div>
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
        <div className='octo-propertyrow'>
          <div className='octo-propertyname'>Max submissions</div>
          <TextField
            required
            value={currentBounty.maxSubmissions}
            type='number'
            size='small'
            inputProps={{ step: 1, min: 1 }}
            sx={{
              width: 250
            }}
            disabled={!canEdit}
            onChange={updateBountyMaxSubmissions}
          />
        </div>
        )}
      </>
      )}
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
      <Stack flexDirection='row' justifyContent='space-between' gap={2} alignItems='center'>
        <div
          className='octo-propertyrow'
          style={{
            height: 'fit-content',
            flexGrow: 1
          }}
        >
          <div className='octo-propertyname'>Reviewer</div>
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
        <Box my={1} display='flex' justifyContent='flex-start' width='fit-content'>
          <BountyStatusBadge
            bounty={currentBounty}
            truncate
          />
        </Box>
      </Stack>

      {canEdit && (
      <>
        {bountyProperties}
        {
          currentBounty.approveSubmitters === true && (
            <Box my={2}>
              <BountyApplicantList
                showHeader={false}
                bounty={currentBounty}
                applications={currentBounty.applications}
                permissions={permissions}
              />
            </Box>
          )
        }
      </>
      )}

      {!canEdit && permissions?.userPermissions?.work && !isApplyingBounty && !userApplication && (
        <>
          <Divider sx={{
            my: 2
          }}
          />
          <Stack justifyContent='center' width='100%' flexDirection='row' my={2}>
            <Button
              sx={{
                width: 'fit-content'
              }}
              onClick={() => setIsApplyingBounty(true)}
            >Apply
            </Button>
          </Stack>
        </>
      )}

      {userApplication && permissions?.userPermissions?.work && (
      <UserBountySubmissionTable
        bounty={currentBounty}
        submission={userApplication}
      />
      )}

      {isApplyingBounty && !userApplication && (
        <ApplicationEditorForm
          bountyId={currentBounty.id}
          mode='create'
          onSubmit={() => {
            setIsApplyingBounty(false);
          }}
          onCancel={() => {
            setIsApplyingBounty(false);
          }}
        />
      )}
    </Box>
  );
}
