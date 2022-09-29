
import type { MetaTransactionData } from '@gnosis.pm/safe-core-sdk-types';
import { Checkbox, List, ListItem, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import type { Bounty, UserGnosisSafe } from '@prisma/client';
import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { DialogTitle, Modal } from 'components/common/Modal';
import UserDisplay from 'components/common/UserDisplay';
import { getChainById } from 'connectors';
import { ethers } from 'ethers';
import { useBounties } from 'hooks/useBounties';
import { useContributors } from 'hooks/useContributors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import useGnosisSigner from 'hooks/useWeb3Signer';
import type { SafeData } from 'lib/gnosis';
import { getSafesForAddress } from 'lib/gnosis';
import { eToNumber } from 'lib/utilities/numbers';
import { isTruthy } from 'lib/utilities/types';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import type { BountyWithDetails } from 'lib/bounties';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { BountyAmount } from './BountyStatusBadge';
import type { MultiPaymentResult } from './MultiPaymentButton';
import MultiPaymentButton from './MultiPaymentButton';

interface TransactionWithMetadata extends MetaTransactionData, Pick<Bounty, 'rewardToken' | 'rewardAmount' | 'chainId'>{
  applicationId: string;
  userId: string;
  title: string;
}

export default function MultiPaymentModal ({ bounties }: { bounties: BountyWithDetails[] }) {
  const [isLoading, setIsLoading] = useState(false);
  const [gnosisSafeData, setGnosisSafeData] = useState<SafeData | null>(null);
  const { data: userGnosisSafes } = useMultiWalletSigs();
  const { setBounties, setCurrentBounty, currentBountyId } = useBounties();
  const popupState = usePopupState({ variant: 'popover', popupId: 'multi-payment-modal' });
  const [currentSpace] = useCurrentSpace();
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const [contributors] = useContributors();
  const { account, chainId } = useWeb3React();
  const signer = useGnosisSigner();
  const { data: safeData } = useSWR(
    (signer && account && chainId) ? `/connected-gnosis-safes/${account}` : null,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    () => getSafesForAddress({ signer: signer!, chainId: chainId!, address: account! })
  );

  const userGnosisSafeRecord = userGnosisSafes?.reduce<Record<string, UserGnosisSafe>>((record, userGnosisSafe) => {
    record[userGnosisSafe.address] = userGnosisSafe;
    return record;
  }, {}) ?? {};

  useEffect(() => {
    if (safeData) {
      setGnosisSafeData(safeData[0]);
    }
  }, [safeData]);

  const gnosisSafeAddress = gnosisSafeData?.address;
  const gnosisSafeChainId = gnosisSafeData?.chainId;

  // If the bounty is on the same chain as the gnosis safe and the rewardToken of the bounty is the same as the native currency of the gnosis safe chain
  const transactions: TransactionWithMetadata[] = useMemo(
    () => bounties
      .filter(bounty => {
        return safeData
          ? safeData.find(
            ({ chainId: safeChainId }) => bounty.chainId === safeChainId && bounty.rewardToken === getChainById(safeChainId)?.nativeCurrency.symbol
          )
          : false;
      })
      .map(bounty => {
        return bounty.applications.map(application => {
          if (application.status === 'complete') {
            const value = ethers.utils.parseUnits(eToNumber(bounty.rewardAmount), 18).toString();
            return {
              to: application.walletAddress as string,
              value,
              // This has to be 0x don't change it
              data: '0x',
              applicationId: application.id,
              userId: application.createdBy,
              chainId: bounty.chainId,
              rewardAmount: bounty.rewardAmount,
              rewardToken: bounty.rewardToken,
              title: bounty.page?.title || 'Untitled'
            };
          }
          return false;
        }).filter(isTruthy);
      })
      .flat(),
    [bounties, safeData]
  );

  useEffect(() => {
    const applicationIds = transactions.map(transaction => transaction.applicationId);
    setSelectedApplicationIds(applicationIds);
  }, [transactions]);

  // A record to keep track of application id an its corresponding transaction
  const applicationTransactionRecord: Record<string, TransactionWithMetadata> = {};
  transactions.forEach(transaction => {
    applicationTransactionRecord[transaction.applicationId] = transaction;
  });

  async function onPaymentSuccess (result: MultiPaymentResult) {
    if (gnosisSafeAddress && gnosisSafeChainId) {
      setIsLoading(true);
      await Promise.all(
        result.transactions.map(async (transaction) => {
          await charmClient.bounties.recordTransaction({
            applicationId: transaction.applicationId,
            transactionId: result.txHash,
            chainId: gnosisSafeChainId.toString()
          });
          await charmClient.bounties.markSubmissionAsPaid(transaction.applicationId);
        })
      );

      if (currentSpace) {
        charmClient.bounties.listBounties(currentSpace.id)
          .then(_bounties => {
            setBounties(_bounties);
            const newCurrentBounty = _bounties.find(_bounty => _bounty.id === currentBountyId);
            if (newCurrentBounty) {
              setCurrentBounty({ ...newCurrentBounty });
            }
          });
      }
      setIsLoading(false);
      setSelectedApplicationIds([]);
      popupState.close();
    }
  }

  const isDisabled = transactions.length === 0;

  const modalProps = bindPopover(popupState);

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
              {transactions.map(({ title, chainId: _chainId, rewardAmount, rewardToken, userId, applicationId }) => {
                const user = contributors.find(contributor => contributor.id === userId);
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
                transactions={selectedApplicationIds.map(selectedApplicationId => applicationTransactionRecord[selectedApplicationId])}
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
