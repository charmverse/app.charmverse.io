import { InvalidInputError } from '@charmverse/core/errors';
import { getChainById } from 'connectors/chains';
import flatten from 'lodash/flatten';

import { accessTypeDict } from 'lib/metrics/mixpanel/constants';

import type { TokenGate, TokenGateAccessType } from './interfaces';
import { getAccessTypes } from './utils';

export function processTokenGateConditions(tokenGate: TokenGate): {
  accessTypes: TokenGateAccessType[];
  numberOfConditions: number;
  chainType: string | string[];
  accesType: string | string[];
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

  // Make sure token gate has at least 1 condition.
  if (numberOfConditions < 1) {
    throw new InvalidInputError('Your token gate must contain at least one condition.');
  }
  const accesType =
    accessTypes.length === 1 ? accessTypeDict[accessTypes[0]] : accessTypes.map((at) => accessTypeDict[at]);

  const chainType = chains.length === 1 ? chains[0] : chains;

  return { accessTypes, numberOfConditions, chainType, accesType };
}
