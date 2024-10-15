import { getChainShortname } from '@root/connectors/chains';

export function getGnosisTransactionQueueUrl(address: string, chainId: number) {
  // Safe still has 'matic' in their urls instead of pol
  const shortName = chainId === 137 ? 'matic' : getChainShortname(chainId);

  return `https://app.safe.global/${shortName}:${address}/transactions/queue`;
}

export function getGnosisTransactionUrl(address: string, chainId: number, safeTxHash: string) {
  // Safe still has 'matic' in their urls instead of pol
  const shortName = chainId === 137 ? 'matic' : getChainShortname(chainId);

  return `https://app.safe.global/transactions/tx?safe=${shortName}:${address}&id=${safeTxHash}`;
}

export function getGnosisSafeUrl(address: string, chainId: number) {
  // Safe still has 'matic' in their urls instead of pol
  const shortName = chainId === 137 ? 'matic' : getChainShortname(chainId);

  return `https://app.safe.global/${shortName}:${address}`;
}
