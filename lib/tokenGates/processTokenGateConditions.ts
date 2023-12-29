import { InvalidInputError } from '@charmverse/core/errors';
import type { AccsRegularParams } from '@lit-protocol/types';
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
  if (tokenGate.type === 'lit') {
    // Flatten to get all nested conditions in the same flat array
    const conditionsArr = flatten(tokenGate.conditions?.unifiedAccessControlConditions as AccsRegularParams[]);
    const conditions = conditionsArr.filter((c) => Boolean(c.chain));
    const chains: string[] = tokenGate.conditions?.chains || [];
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

  if (tokenGate.type === 'unlock') {
    if (tokenGate.conditions?.contract && tokenGate.conditions?.chainId) {
      const chain = getChainById(tokenGate.conditions.chainId)?.chainName;
      return {
        accessTypes: ['group_token_or_nft'],
        numberOfConditions: 1,
        chainType: chain || 'ethereum',
        accesType: accessTypeDict.group_token_or_nft
      };
    } else {
      throw new InvalidInputError('Your token gate must contain a valid contract and chainId.');
    }
  }

  return { accessTypes: [], numberOfConditions: 0, chainType: '', accesType: '' };
}
