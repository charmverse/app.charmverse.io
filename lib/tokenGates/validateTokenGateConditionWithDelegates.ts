import { log } from '@charmverse/core/log';
import { getIncomingDelegations } from '@root/lib/blockchain/delegateXYZ/client';

import type { AccessControlCondition } from './interfaces';
import { validateTokenGateCondition } from './validateTokenGateCondition';

// attempt to validate the address. if it fails, check for delegated addresses from delegate.xyz
export async function validateTokenGateConditionWithDelegates(
  condition: AccessControlCondition,
  walletAddress: string
) {
  const initialResult = await validateTokenGateCondition(condition, walletAddress);
  // if token gate will fail, check for delegated addresses
  if (!initialResult) {
    const delegations = await getIncomingDelegations(Number(condition.chain), walletAddress as `0x${string}`);
    // user may choose to only delegate an address for a specific contract address or token
    // note that the delegation may even include an amount, but we don't check that here
    const eligibleDelegations = delegations.filter((delegation) => {
      if (delegation.type === 'ALL') {
        return true;
      } else if (delegation.contract === condition.contractAddress) {
        if (delegation.tokenId === 0 || condition.tokenIds.includes(delegation.tokenId.toString())) {
          return true;
        }
      }
      return false;
    });
    for (const delegatedAddress of eligibleDelegations) {
      const result = await validateTokenGateCondition(condition, delegatedAddress.from);
      if (result) {
        log.debug('Validated wallet using delegated address', { walletAddress, delegatedAddress });
        return true;
      }
    }
  }
  return initialResult;
}
