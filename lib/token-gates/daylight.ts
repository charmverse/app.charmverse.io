import type { TokenGate } from '@prisma/client';
import type { AccessControlCondition } from 'lit-js-sdk';
import { flatten } from 'lodash';

import { prisma } from 'db';

import { getAccessType } from './utils';

export async function addToDaylight (spaceId: string, tokenGate: TokenGate) {
  const space = await prisma.space.findUnique({ where: { id: spaceId } });
  if (!space) {
    return;
  }

  type ConditionOperator = { operator: 'and' | 'or' }
  type Condition = AccessControlCondition | ConditionOperator;
  type TokenGateAccessConditions = (Condition | Condition[])[];

  function getRequirement (condition: AccessControlCondition) {
    const accessType = getAccessType(condition);

    switch (accessType) {
      case 'individual_wallet': {
        if (!condition.contractAddress) {
          return null;
        }

        return {
          chain: condition.chain,
          type: 'onAllowlist',
          addresses: [condition.returnValueTest.value]
        };
      }

      case 'individual_nft': {
        if (!condition.contractAddress) {
          return null;
        }

        return {
          chain: condition.chain,
          type: 'hasNftWithSpecificId',
          address: condition.contractAddress,
          id: condition.parameters
        };
      }

      case 'group_token_or_nft': {
        if (!condition.contractAddress) {
          return null;
        }

        return {
          chain: condition.chain,
          type: 'hasTokenBalance',
          address: condition.contractAddress,
          minAmount: condition.returnValueTest.value
        };
      }

      default: {
        return null;
      }
    }
  }

  function getDaylightRequirements (conditionsData: TokenGateAccessConditions) {
    const conditionsFlatArr = flatten(conditionsData);

    const operators = conditionsFlatArr.filter(condition => {
      return 'operator' in condition;
    }) as ConditionOperator[];

    const conditions = conditionsFlatArr.filter(condition => {
      return 'chain' in condition;
    }) as AccessControlCondition[];

    const conditionsOperator: 'or' | 'and' = operators[0]?.operator || 'or';

    if (conditions.length > 1 && operators.some(o => o.operator !== operators[0].operator)) {
      // Daylight does not support multiple operators, do not proceed
      return { requirements: [], operator: conditionsOperator };
    }

    const requirements = conditions.map(condition => getRequirement(condition));
    const hasInvalidRequirements = requirements.some(r => r === null);

    return {
      requirements: hasInvalidRequirements ? [] : requirements,
      operator: conditionsOperator
    };
  }

  const requirements = getDaylightRequirements((tokenGate.conditions as any)?.unifiedAccessControlConditions as any);

  const options = {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', authorization: `Bearer ${process.env.DAYLIGHT_API_KEY}` },
    body: JSON.stringify({
      // eslint-disable-next-line object-shorthand
      requirements: requirements,
      action: { linkUrl: `https//:charmverse.io/join?domain=${space.domain}` },
      title: 'workspace',
      type: 'access',
      isActive: true,
      sourceId: tokenGate.id
    })
  };

  await fetch('https://api.daylight.xyz/v1/abilities', options)
    .then(response => response.json())
  // eslint-disable-next-line no-console
    .then(response => console.log(response))
  // eslint-disable-next-line no-console
    .catch(err => console.error(err));
}
