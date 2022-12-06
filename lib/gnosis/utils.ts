import { getChainShortname } from 'connectors';
import { ethers } from 'ethers';

export function getFriendlyEthValue(value: string) {
  const valueBigNumber = ethers.BigNumber.from(value);
  const ethersValue = ethers.utils.formatEther(valueBigNumber);
  const upperBound = ethers.BigNumber.from(ethers.utils.parseEther('0.001'));
  if (valueBigNumber.gt(0) && valueBigNumber.lt(upperBound)) {
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
