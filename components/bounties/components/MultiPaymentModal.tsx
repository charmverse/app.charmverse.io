
import { Checkbox, List, ListItem, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import type { UserGnosisSafe } from '@prisma/client';
import { getChainById } from 'connectors';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';

import Button from 'components/common/Button';
import { DialogTitle, Modal } from 'components/common/Modal';
import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import type { TransactionWithMetadata } from 'hooks/useMultiBountyPayment';
import { useMultiBountyPayment } from 'hooks/useMultiBountyPayment';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import type { BountyWithDetails } from 'lib/bounties';

import { BountyAmount } from './BountyStatusBadge';
import MultiPaymentButton from './MultiPaymentButton';

export default function MultiPaymentModal ({ bounties }: { bounties: BountyWithDetails[] }) {
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const popupState = usePopupState({ variant: 'popover', popupId: 'multi-payment-modal' });
  const modalProps = bindPopover(popupState);
  const { data: userGnosisSafes } = useMultiWalletSigs();

  const {
    isDisabled,
    onPaymentSuccess,
    transactions,
    gnosisSafeAddress,
    gnosisSafeChainId,
    safeData,
    gnosisSafeData,
    isLoading,
    setGnosisSafeData
  } = useMultiBountyPayment({ bounties,
    postPaymentSuccess () {
      setSelectedApplicationIds([]);
      popupState.close();
    } });

  const userGnosisSafeRecord = userGnosisSafes?.reduce<Record<string, UserGnosisSafe>>((record, userGnosisSafe) => {
    record[userGnosisSafe.address] = userGnosisSafe;
    return record;
  }, {}) ?? {};

  const { members } = useMembers();

  useEffect(() => {
    const applicationIds = transactions.map(transaction => transaction().applicationId);
    setSelectedApplicationIds(applicationIds);
  }, [transactions]);

  // A record to keep track of application id an its corresponding transaction
  const applicationTransactionRecord: Record<string, (address: string) => TransactionWithMetadata> = {};
  transactions.forEach(transaction => {
    applicationTransactionRecord[transaction().applicationId] = transaction;
  });

  return (
    <>
      <Tooltip arrow placement='top' title={isDisabled ? `Batch payment requires at least one Completed bounty on the ${getChainById(gnosisSafeChainId || 1)?.chainName} network` : ''}>
        <div>
          <Button
            {...bindTrigger(popupState)}
            variant='outlined'
            color='secondary'
            disabled={isDisabled}
          >
            Batch Payment ({transactions.length})
          </Button>
        </div>
      </Tooltip>
      {!isDisabled && (
        <Modal
          {...modalProps}
          size='large'
          onClose={modalProps.onClose}
        >
          <DialogTitle onClose={popupState.close}>
            Pay Bount{transactions.length > 1 ? 'ies' : 'y'}
          </DialogTitle>
          <Box
            mt={2}
          >
            {safeData && (
              <Box justifyContent='space-between' gap={2} alignItems='center' display='flex'>
                <Typography
                  variant='subtitle1'
                  sx={{
                    whiteSpace: 'nowrap'
                  }}
                >Multisig Wallet
                </Typography>
                <Select
                  onChange={(e) => {
                    setGnosisSafeData(safeData.find(safeInfo => safeInfo.address === e.target.value) ?? null);
                  }}
                  sx={{ flexGrow: 1 }}
                  value={gnosisSafeData?.address ?? ''}
                  displayEmpty
                  fullWidth
                  renderValue={(safeAddress) => {
                    if (safeAddress.length === 0) {
                      return (
                        <Typography
                          color='secondary'
                        >Please select your wallet
                        </Typography>
                      );
                    }
                    return userGnosisSafeRecord[safeAddress]?.name ?? safeAddress;
                  }}
                >
                  {safeData.map(safeInfo => (
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
                const user = members.find(member => member.id === userId);
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
                            const ids = selectedApplicationIds.filter(selectedApplicationId => selectedApplicationId !== applicationId);
                            setSelectedApplicationIds(ids);
                          }
                          else {
                            setSelectedApplicationIds([...selectedApplicationIds, applicationId]);
                          }
                        }}
                      />
                      <Box display='flex' justifyContent='space-between' sx={{ width: '100%' }}>
                        <Box display='flex' gap={2} alignItems='center'>
                          <UserDisplay
                            avatarSize='small'
                            user={user}
                          />
                          <Typography variant='body2' color='secondary'>
                            {title}
                          </Typography>
                        </Box>
                        <BountyAmount
                          bounty={{
                            chainId: _chainId,
                            rewardAmount,
                            rewardToken
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
            {(gnosisSafeChainId && gnosisSafeAddress) && (
              <MultiPaymentButton
                chainId={gnosisSafeChainId}
                safeAddress={gnosisSafeAddress}
                transactions={selectedApplicationIds.map(selectedApplicationId => (
                  applicationTransactionRecord[selectedApplicationId](gnosisSafeAddress)
                ))}
                onSuccess={onPaymentSuccess}
                isLoading={isLoading}
              />
            )}
          </Box>
        </Modal>
      )}
    </>
  );
}
