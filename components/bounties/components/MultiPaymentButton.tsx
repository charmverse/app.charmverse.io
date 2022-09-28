import type { MetaTransactionData } from '@gnosis.pm/safe-core-sdk-types';
import { Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import { useBountyPayment } from 'hooks/useMultiBountyPayment';

export interface MultiPaymentResult {
  transactions: (MetaTransactionData & { applicationId: string })[];
  txHash: string;
}

interface Props {
  chainId: number;
  onSuccess: (result: MultiPaymentResult) => void;
  safeAddress: string;
  transactions: (MetaTransactionData & { applicationId: string })[];
  isLoading: boolean;
}

export default function MultiPaymentButton ({ isLoading, chainId, safeAddress, transactions, onSuccess }: Props) {
  const { safe, makePayment } = useBountyPayment({
    chainId,
    onSuccess,
    safeAddress,
    transactions
  });

  return (
    <Tooltip arrow placement='top' title={!safe ? `Connect your wallet to the Gnosis safe: ${safeAddress}` : ''}>
      <span>
        <Button disabled={isLoading || !safe || transactions.length === 0} onClick={makePayment}>
          Make Payment ({transactions.length})
        </Button>
      </span>
    </Tooltip>
  );
}
