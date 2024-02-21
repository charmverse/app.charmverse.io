import { writeFile } from 'node:fs';

import { prisma } from '@charmverse/core/prisma-client';
import type { JsonAccsRequest } from '@lit-protocol/types';
import { RPCList } from 'connectors/chains';

import type { Operator, TokenGateConditions } from 'lib/tokenGates/interfaces';
import { isNumber } from 'lib/utilities/numbers';
import { isTruthy } from 'lib/utilities/types';

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
        'path' in condition
      ) {
        return null;
      }
      const chainId = RPCList.find((chain) => chain.litNetwork === condition.chain)?.chainId || 1;

      return {
        contractAddress: condition.contractAddress,
        type: condition.standardContractType,
        chain: chainId,
        condition: 'evm',
        method: condition.method,
        tokenIds: condition.parameters
          .map((param) => {
            if (isNumber(Number(param))) {
              return param;
            }
            return null;
          })
          .filter(isTruthy),
        quantity: condition.returnValueTest.value
      };
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
  const payload = data.map((item) => {
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
              tokenIds: ['0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2'],
              quantity: '1',
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
              type: 'Hypersub',
              contractAddress: item.conditions?.contract || '',
              method: 'balanceOf',
              tokenIds: ['0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2'],
              quantity: '1',
            }
          ]
        }
      };
    }

    return item;
  });


//   await writeFile(path, JSON.stringify({ tokenGates: payload }, null, 2), (error) => {
//     if (error) {
//       console.log('An error has occurred ', error);
//       return;
//     }
//     console.log('Data written successfully to disk');
//   });
// }
logNow().then(() => console.log('DOne'));