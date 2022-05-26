
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
import MultiPaymentButton, { MultiPaymentResult } from './MultiPaymentButton';

export default function MultiPaymentModal ({ bounties }: {bounties: PopulatedBounty[]}) {

  const { setBounties } = useBounties();
  const popupState = usePopupState({ variant: 'popover', popupId: 'multi-payment-modal' });
  const [paymentMethods] = usePaymentMethods();
  const [currentSpace] = useCurrentSpace();
  const gnosisPayment = paymentMethods.find(p => p.walletType === 'gnosis');
  const safeAddress = gnosisPayment?.gnosisSafeAddress;
  const transactions: (MetaTransactionData & {applicationId: string})[] = [];

  if (gnosisPayment) {
    bounties.forEach(bounty => {
      // If the bounty is on the same chain as the gnosis safe
      if (bounty.chainId === gnosisPayment?.chainId) {
        bounty.applications.forEach(application => {
          if (application.status === 'complete') {
            const value = ethers.utils.parseUnits(eToNumber(bounty.rewardAmount), 18).toString();
            transactions.push({
              to: application.walletAddress as string,
              value,
              data: '0x',
              applicationId: application.id
            });
          }
        });
      }
    });
  }

  async function onPaymentSuccess (result: MultiPaymentResult) {
    if (gnosisPayment) {
      await Promise.all(
        result.transactions.map(async (transaction) => {
          await charmClient.recordTransaction({
            applicationId: transaction.applicationId,
            transactionId: result.txHash,
            chainId: gnosisPayment.chainId.toString()
          });
          await charmClient.reviewSubmission(transaction.applicationId, 'pay');
        })
      );

      if (currentSpace) {
        charmClient.listBounties(currentSpace.id)
          .then(_bounties => {
            setBounties(_bounties);
          });
      }
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
      >
        Batch Payment ({transactions.length})
      </Button>
      <Modal {...bindPopover(popupState)} size='large'>
        <DialogTitle onClose={popupState.close}>Batch Payments</DialogTitle>
        <Box py={2}>
          {/* <ul>
            {bountiesOnSameChain.map(bounty => (
              <li>{bounty.title}</li>
            ))}
          </ul> */}
        </Box>
        <MultiPaymentButton
          chainId={gnosisPayment.chainId}
          safeAddress={safeAddress}
          transactions={transactions}
          onSuccess={onPaymentSuccess}
        />
      </Modal>
    </>
  );
}
