import { getChainShortname } from 'connectors';
import { formatEther, parseEther } from 'ethers';

export function getFriendlyEthValue(value: string) {
  const valueBigNumber = BigInt(value);
  const ethersValue = formatEther(valueBigNumber);
  const upperBound = BigInt(parseEther('0.001'));
  if (valueBigNumber > 0 && valueBigNumber < upperBound) {
    return '< 0.0001';
  } else {
    return ethersValue;
  }
}

export function getGnosisTransactionQueueUrl(address: string, chainId: number) {
  return `https://app.safe.global/${getChainShortname(chainId)}:${address}/transactions/queue`;
}

export function getGnosisSafeUrl(address: string, chainId: number) {
  return `https://app.safe.global/${getChainShortname(chainId)}:${address}`;
}
