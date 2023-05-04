import type { UserGnosisSafe } from '@charmverse/core/prisma';
import { Checkbox, List, ListItem, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { getChainById } from 'connectors';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';

import Button from 'components/common/Button';
import { DialogTitle, Modal } from 'components/common/Modal';
import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import { useMultiBountyPayment } from 'hooks/useMultiBountyPayment';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import type { BountyWithDetails } from 'lib/bounties';
import { isTruthy } from 'lib/utilities/types';

import { BountyAmount } from './BountyStatusBadge';
import MultiPaymentButton from './MultiPaymentButton';

export function MultiPaymentModal({ bounties }: { bounties: BountyWithDetails[] }) {
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const popupState = usePopupState({ variant: 'popover', popupId: 'multi-payment-modal' });
  const modalProps = bindPopover(popupState);
  const { data: userGnosisSafes } = useMultiWalletSigs();

  const { isDisabled, onPaymentSuccess, transactions, gnosisSafes, gnosisSafeData, isLoading, setGnosisSafeData } =
    useMultiBountyPayment({
      bounties,
      postPaymentSuccess() {
        setSelectedApplicationIds([]);
        popupState.close();
      }
    });

  const gnosisSafeAddress = gnosisSafeData?.address;
  const gnosisSafeChainId = gnosisSafeData?.chainId;

  const userGnosisSafeRecord =
    userGnosisSafes?.reduce<Record<string, UserGnosisSafe>>((record, userGnosisSafe) => {
      record[userGnosisSafe.address] = userGnosisSafe;
      return record;
    }, {}) ?? {};

  const { getMemberById } = useMembers();

  useEffect(() => {
    const applicationIds = transactions.map((trans) => trans(gnosisSafeAddress).applicationId);
    setSelectedApplicationIds(applicationIds);
  }, [transactions]);

  const selectedTransactions = selectedApplicationIds
    .map((applicationId) => {
      const transaction = transactions.find((trans) => trans(gnosisSafeAddress).applicationId === applicationId);
      return transaction?.(gnosisSafeAddress);
    })
    .filter(isTruthy);

  return (
    <>
      <Tooltip
        arrow
        placement='top'
        title={
          isDisabled
            ? `Batch payment requires at least one Completed bounty on the ${
                getChainById(gnosisSafeChainId || 1)?.chainName
              } network`
            : ''
        }
      >
        <div>
          <Button {...bindTrigger(popupState)} variant='outlined' color='secondary' disabled={isDisabled}>
            Batch Payment ({transactions.length})
          </Button>
        </div>
      </Tooltip>
      {!isDisabled && (
        <Modal {...modalProps} size='large' onClose={modalProps.onClose}>
          <DialogTitle onClose={popupState.close}>Pay Bount{transactions.length > 1 ? 'ies' : 'y'}</DialogTitle>
          <Box mt={2}>
            {gnosisSafes && (
              <Box justifyContent='space-between' gap={2} alignItems='center' display='flex'>
                <Typography
                  variant='subtitle1'
                  sx={{
                    whiteSpace: 'nowrap'
                  }}
                >
                  Multisig Wallet
                </Typography>
                <Select
                  onChange={(e) => {
                    setGnosisSafeData(gnosisSafes.find((safeInfo) => safeInfo.address === e.target.value) ?? null);
                  }}
                  sx={{ flexGrow: 1 }}
                  value={gnosisSafeData?.address ?? ''}
                  displayEmpty
                  fullWidth
                  renderValue={(safeAddress) => {
                    if (safeAddress.length === 0) {
                      return <Typography color='secondary'>Please select your wallet</Typography>;
                    }
                    return userGnosisSafeRecord[safeAddress]?.name ?? safeAddress;
                  }}
                >
                  {gnosisSafes.map((safeInfo) => (
                    <MenuItem key={safeInfo.address} value={safeInfo.address}>
                      {userGnosisSafeRecord[safeInfo.address]?.name ?? safeInfo.address}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            )}
          </Box>
          <Box pb={2}>
            <List>
              {transactions.map((getTransaction) => {
                const { title, chainId: _chainId, rewardAmount, rewardToken, userId, applicationId } = getTransaction();
                const user = getMemberById(userId);
                const isChecked = selectedApplicationIds.includes(applicationId);
                if (user) {
                  return (
                    <ListItem key={`${userId}.${_chainId}.${applicationId}`}>
                      <Checkbox
                        disableFocusRipple
                        disableRipple
                        disableTouchRipple
                        sx={{
                          p: 0,
                          pr: 1
                        }}
                        size='medium'
                        checked={isChecked}
                        onChange={(event) => {
                          if (!event.target.checked) {
                            const ids = selectedApplicationIds.filter(
                              (selectedApplicationId) => selectedApplicationId !== applicationId
                            );
                            setSelectedApplicationIds(ids);
                          } else {
                            setSelectedApplicationIds([...selectedApplicationIds, applicationId]);
                          }
                        }}
                      />
                      <Box display='flex' justifyContent='space-between' sx={{ width: '100%' }}>
                        <Box display='flex' gap={2} alignItems='center'>
                          <UserDisplay showMiniProfile avatarSize='small' user={user} />
                          <Typography variant='body2' color='secondary'>
                            {title}
                          </Typography>
                        </Box>
                        <BountyAmount
                          bounty={{
                            chainId: _chainId,
                            rewardAmount,
                            rewardToken,
                            customReward: null
                          }}
                        />
                      </Box>
                    </ListItem>
                  );
                }
                return null;
              })}
            </List>
          </Box>
          <Box display='flex' gap={2} alignItems='center'>
            <MultiPaymentButton
              chainId={gnosisSafeChainId}
              safeAddress={gnosisSafeAddress || ''}
              transactions={selectedTransactions}
              onSuccess={onPaymentSuccess}
              isLoading={isLoading}
            />
          </Box>
        </Modal>
      )}
    </>
  );
}
