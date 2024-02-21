import { writeFile } from 'node:fs';

import { TokenGate, prisma } from '@charmverse/core/prisma-client';
import type { JsonAccsRequest } from '@lit-protocol/types';
import { RPCList } from 'connectors/chains';

import type { Operator, TokenGateConditions } from 'lib/tokenGates/interfaces';
import { isTruthy } from 'lib/utilities/types';
import { validateTokenGateConditions } from 'lib/tokenGates/validateTokenGateConditions';

const path = './config.json';

export function transformToTokenGateCondition(conditions: JsonAccsRequest): TokenGateConditions {
  const unifiedAccessControlCondition =
    conditions.unifiedAccessControlConditions || conditions.accessControlConditions || [];
  const operator = (unifiedAccessControlCondition
    .map((condition) => {
      if ('operator' in condition) {
        return condition.operator.toUpperCase() as Operator;
      } else {
        return null;
      }
    })
    .filter(isTruthy)
    .at(0) || 'OR') as Operator;

  const tranformedConditions = unifiedAccessControlCondition
    .map((condition) => {
      if (
        !condition ||
        'operator' in condition ||
        Array.isArray(condition) ||
        'functionName' in condition ||
        'pdaInterface' in condition ||
        'path' in condition ||
        !('standardContractType' in condition)
      ) {
        return null;
      }
      const chainId = RPCList.find((chain) => chain.litNetwork === condition.chain)?.chainId || 1;

      if (
        condition.standardContractType === 'ERC1155' &&
        condition.contractAddress &&
        condition.method === 'balanceOf'
      ) {
        return {
          contractAddress: condition.contractAddress,
          type: condition.standardContractType,
          chain: chainId,
          condition: 'evm',
          method: condition.method,
          tokenIds: [condition.parameters[1] || condition.parameters[0] || null].filter(isTruthy),
          quantity: condition.returnValueTest.value || '1'
        };
      } else if (
        condition.standardContractType === 'ERC1155' &&
        condition.contractAddress &&
        condition.method === 'balanceOfBatch'
      ) {
        return {
          contractAddress: condition.contractAddress,
          type: condition.standardContractType,
          chain: chainId,
          condition: 'evm',
          method: condition.method,
          tokenIds: [(condition.parameters[1] || condition.parameters[0] || '').split(',')].filter(isTruthy),
          quantity: condition.returnValueTest.value || '1'
        };
      } else if (
        condition.standardContractType === 'ERC721' &&
        condition.contractAddress &&
        condition.method === 'ownerOf'
      ) {
        return {
          contractAddress: condition.contractAddress,
          type: condition.standardContractType,
          chain: chainId,
          condition: 'evm',
          method: condition.method,
          tokenIds: [condition.parameters[0]],
          quantity: '1'
        };
      } else if (
        condition.standardContractType === 'ERC721' &&
        condition.contractAddress &&
        condition.method === 'balanceOf'
      ) {
        return {
          contractAddress: condition.contractAddress,
          type: condition.standardContractType,
          chain: chainId,
          condition: 'evm',
          method: condition.method,
          tokenIds: [],
          quantity: condition.returnValueTest?.value || '1'
        };
      } else if (!condition.standardContractType && condition.method === 'eth_getBalance') {
        return {
          contractAddress: '',
          type: condition.standardContractType,
          chain: chainId,
          condition: 'evm',
          method: condition.method,
          tokenIds: [],
          quantity: condition.returnValueTest?.value || '1'
        };
      } else if (
        condition.standardContractType === 'ERC20' &&
        condition.contractAddress &&
        condition.method === 'balanceOf'
      ) {
        return {
          contractAddress: condition.contractAddress,
          type: condition.standardContractType,
          chain: chainId,
          condition: 'evm',
          method: condition.method,
          tokenIds: [],
          quantity: condition.returnValueTest?.value || '1'
        };
      } else if (condition.standardContractType === 'MolochDAOv2.1') {
        return {
          contractAddress: condition.contractAddress,
          type: condition.standardContractType,
          chain: chainId,
          condition: 'evm',
          method: condition.method,
          tokenIds: [],
          quantity: '1'
        };
      } else if (
        !condition.contractAddress &&
        !condition.standardContractType &&
        !condition.method &&
        condition.returnValueTest?.value
      ) {
        return {
          contractAddress: condition.contractAddress,
          type: condition.standardContractType,
          chain: chainId,
          condition: 'evm',
          method: condition.method,
          tokenIds: [condition.returnValueTest?.value],
          quantity: '1'
        };
      } else if (condition.standardContractType === 'CASK') {
        return {
          contractAddress: condition.contractAddress,
          type: condition.standardContractType,
          chain: chainId,
          condition: 'evm',
          method: 'balanceOf',
          tokenIds: [],
          quantity: condition.returnValueTest?.value || '1'
        };
      } else if (condition.standardContractType === 'CASK') {
        return {
          contractAddress: condition.contractAddress,
          type: condition.standardContractType,
          chain: chainId,
          condition: 'evm',
          method: 'balanceOf',
          tokenIds: [],
          quantity: '1'
        };
      } else if (condition.standardContractType === 'POAP') {
        return {
          contractAddress: condition.contractAddress,
          type: condition.standardContractType,
          chain: chainId,
          condition: 'evm',
          method: condition.method === 'tokenURI' ? 'eventName' : 'eventId',
          tokenIds: [condition.returnValueTest?.value].filter(isTruthy),
          quantity: '1'
        };
      }
      console.log('no conditions met', condition, condition.returnValueTest);
      return null;
    })
    .filter(isTruthy);

  return {
    accessControlConditions: tranformedConditions,
    operator
  };
}

async function logNow() {
  const data = await prisma.tokenGate.findMany({
    select: {
      id: true,
      spaceId: true,
      conditions: true,
      type: true
    }
  });
  // console.log(data.length);
  // const found = data?.filter((i) => !!i.conditions?.unifiedAccessControlConditions?.find((c) => c.parameters));
  // console.log('found', found.length, found?.conditions?.unifiedAccessControlConditions);
  // return;
  const payload: Pick<TokenGate, 'conditions' | 'id' | 'spaceId' | 'type'>[] = data.map((item) => {
    if (item.type === 'lit') {
      const cond = transformToTokenGateCondition(item.conditions as any as JsonAccsRequest);
      return {
        ...item,
        conditions: cond
      };
    }

    if (item.type === 'hypersub') {
      return {
        ...item,
        conditions: {
          operator: 'OR',
          accessControlConditions: [
            {
              chain: Number(item.conditions?.chainId) || 1,
              condition: 'evm',
              type: 'Hypersub',
              contractAddress: item.conditions?.contract || '',
              method: 'balanceOf',
              tokenIds: [],
              quantity: '1'
            }
          ]
        }
      };
    }

    if (item.type === 'unlock') {
      return {
        ...item,
        conditions: {
          operator: 'OR',
          accessControlConditions: [
            {
              chain: Number(item.conditions?.chainId) || 1,
              condition: 'evm',
              type: 'Unlock',
              contractAddress: item.conditions?.contract || '',
              method: 'balanceOf',
              tokenIds: [],
              quantity: '1'
            }
          ]
        }
      };
    }

    return item;
  });

  for (const tk of payload) {
    await validateTokenGateConditions(tk as any as TokenGate);
  }

  // for (const tk of payload) {
  //   await prisma.tokenGate.update({
  //     where: {
  //       id: tk.id
  //     },
  //     data: {
  //       conditions: tk.conditions
  //     }
  //   });
  // }

  // await writeFile(path, JSON.stringify({ tokenGates: payload }, null, 2), (error) => {
  //   if (error) {
  //     console.log('An error has occurred ', error);
  //     return;
  //   }
  //   console.log('Data written successfully to disk');
  // });
}
logNow().then(() => console.log('Done'));
