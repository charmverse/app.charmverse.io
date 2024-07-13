import { getChainShortname } from '@root/connectors/chains';

export function getGnosisTransactionQueueUrl(address: string, chainId: number) {
  return `https://app.safe.global/${getChainShortname(chainId)}:${address}/transactions/queue`;
}

export function getGnosisTransactionUrl(address: string, chainId: number, safeTxHash: string) {
  return `https://app.safe.global/transactions/tx?safe=${getChainShortname(chainId)}:${address}&id=${safeTxHash}`;
}

export function getGnosisSafeUrl(address: string, chainId: number) {
  return `https://app.safe.global/${getChainShortname(chainId)}:${address}`;
}
