import { getChainShortname } from 'connectors/chains';

export function getGnosisTransactionQueueUrl(address: string, chainId: number) {
  return `https://app.safe.global/${getChainShortname(chainId)}:${address}/transactions/queue`;
}

export function getGnosisSafeUrl(address: string, chainId: number) {
  return `https://app.safe.global/${getChainShortname(chainId)}:${address}`;
}
