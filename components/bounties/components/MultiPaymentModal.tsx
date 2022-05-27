
import { ethers } from 'ethers';
import { Modal, DialogTitle } from 'components/common/Modal';
import Button from 'components/common/Button';
import Box from '@mui/material/Box';
import charmClient, { PopulatedBounty } from 'charmClient';
import { bindTrigger, bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { MetaTransactionData } from '@gnosis.pm/safe-core-sdk-types';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useBounties } from 'hooks/useBounties';
import { eToNumber } from 'lib/utilities/numbers';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useEffect, useState } from 'react';
import { Checkbox, List, ListItem, ListItemText } from '@mui/material';
import UserDisplay from 'components/common/UserDisplay';
import { useContributors } from 'hooks/useContributors';
import MultiPaymentButton, { MultiPaymentResult } from './MultiPaymentButton';

interface TransactionWithMetadata extends MetaTransactionData{
  applicationId: string
  userId: string
}

export default function MultiPaymentModal ({ bounties }: {bounties: PopulatedBounty[]}) {
  const [isLoading, setIsLoading] = useState(false);
  const { setBounties, setCurrentBounty, currentBountyId } = useBounties();
  const popupState = usePopupState({ variant: 'popover', popupId: 'multi-payment-modal' });
  const [paymentMethods] = usePaymentMethods();
  const [currentSpace] = useCurrentSpace();
  const gnosisPayment = paymentMethods.find(p => p.walletType === 'gnosis');
  const safeAddress = gnosisPayment?.gnosisSafeAddress;
  const [transactions, setTransactions] = useState<TransactionWithMetadata[]>([]);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>(transactions.map(transaction => transaction.applicationId));
  const [contributors] = useContributors();

  useEffect(() => {
    const _transactions: TransactionWithMetadata[] = [];
    if (gnosisPayment) {
      bounties.forEach(bounty => {
        // If the bounty is on the same chain as the gnosis safe
        if (bounty.chainId === gnosisPayment?.chainId) {
          bounty.applications.forEach(application => {
            if (application.status === 'complete') {
              const value = ethers.utils.parseUnits(eToNumber(bounty.rewardAmount), 18).toString();
              _transactions.push({
                to: application.walletAddress as string,
                value,
                data: '0x',
                applicationId: application.id,
                userId: application.createdBy
              });
            }
          });
        }
      });
    }

    setTransactions(_transactions);
    setSelectedApplicationIds(_transactions.map(transaction => transaction.applicationId));
  }, [bounties, gnosisPayment]);

  const applicationTransactionRecord: Record<string, TransactionWithMetadata> = {};
  transactions.forEach(transaction => {
    applicationTransactionRecord[transaction.applicationId] = transaction;
  });

  async function onPaymentSuccess (result: MultiPaymentResult) {
    if (gnosisPayment) {
      setIsLoading(true);
      await Promise.all(
        result.transactions.map(async (transaction) => {
          await charmClient.recordTransaction({
            applicationId: transaction.applicationId,
            transactionId: result.txHash,
            chainId: gnosisPayment.chainId.toString()
          });
          await charmClient.paySubmission(transaction.applicationId);
        })
      );

      if (currentSpace) {
        charmClient.listBounties(currentSpace.id)
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
      setTransactions([]);
      popupState.close();
    }
  }

  if (!safeAddress || transactions.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        {...bindTrigger(popupState)}
        sx={{ ml: 1 }}
        variant='outlined'
        color='secondary'
      >
        Batch Payment ({selectedApplicationIds.length})
      </Button>
      <Modal {...bindPopover(popupState)} size='large'>
        <DialogTitle onClose={popupState.close}>Batch Payments</DialogTitle>
        <Box py={2}>
          <List>
            {transactions.map(({ userId, applicationId }) => {
              const user = contributors.find(contributor => contributor.id === userId);
              const isChecked = selectedApplicationIds.includes(applicationId);
              if (user) {
                return (
                  <ListItem>
                    <Checkbox
                      size='medium'
                      checked={isChecked}
                      onChange={(event) => {
                        if (!event.target.checked) {
                          setSelectedApplicationIds(selectedApplicationIds.filter(selectedApplicationId => selectedApplicationId !== applicationId));
                        }
                        else {
                          setSelectedApplicationIds([...selectedApplicationIds, applicationId]);
                        }
                      }}
                    />
                    <ListItemText>
                      <UserDisplay user={user} />

                    </ListItemText>
                  </ListItem>
                );
              }
              return null;
            })}

          </List>
        </Box>
        <MultiPaymentButton
          chainId={gnosisPayment.chainId}
          safeAddress={safeAddress}
          transactions={selectedApplicationIds.map(selectedApplicationId => applicationTransactionRecord[selectedApplicationId])}
          onSuccess={onPaymentSuccess}
          isLoading={isLoading}
        />
      </Modal>
    </>
  );
}
