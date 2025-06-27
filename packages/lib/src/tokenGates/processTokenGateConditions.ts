import { getChainById } from '@packages/blockchain/connectors/chains';
import { InvalidInputError } from '@packages/core/errors';
import flatten from 'lodash/flatten';

import type { TokenGate } from './interfaces';
import { getAccessTypes, getGateTypes } from './utils';

export function processTokenGateConditions(tokenGate: TokenGate): {
  numberOfConditions: number;
  chainType: string | string[];
  accessType: string | string[];
  gateType: string | string[];
} {
  // Flatten to get all nested conditions in the same flat array
  const conditionsArr = flatten(tokenGate.conditions?.accessControlConditions);
  const conditions = conditionsArr.filter((c) => Boolean(c.chain));
  const chains =
    tokenGate.conditions?.accessControlConditions.map((c) => {
      const chainName = getChainById(c.chain)?.chainName;
      return chainName || '';
    }) || [];
  const numberOfConditions = conditions.length;
  const accessTypes = getAccessTypes(conditions);
  const gateTypes = getGateTypes(conditions);

  // Make sure token gate has at least 1 condition.
  if (numberOfConditions < 1) {
    throw new InvalidInputError('Your token gate must contain at least one condition.');
  }

  const accessType = accessTypes.length === 1 ? accessTypes[0] : accessTypes;
  const gateType = gateTypes.length === 1 ? gateTypes[0] : gateTypes;

  const chainType = chains.length === 1 ? chains[0] : chains;

  return { numberOfConditions, chainType, accessType, gateType };
}
