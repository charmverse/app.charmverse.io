import type { TokenGate } from '@prisma/client';
import type { AccessControlCondition } from 'lit-js-sdk';
import { flatten } from 'lodash';

import fetch from 'adapters/http/fetch.server';
import { baseUrl } from 'config/constants';
import { prisma } from 'db';

import { getAccessType } from './utils';

const DAYLIGHT_API_KEY = process.env.DAYLIGHT_API_KEY;
const HEADERS = {
  accept: 'application/json',
  'content-type': 'application/json',
  authorization: `Bearer ${DAYLIGHT_API_KEY}`
};
const SOURCE_PREFIX = 'charmverse-';

type Operator = 'AND' | 'OR';
type ConditionOperator = { operator: Operator };
type Condition = AccessControlCondition | ConditionOperator;
type TokenGateAccessConditions = (Condition | Condition[])[];

export async function addDaylightAbility(tokenGate: TokenGate) {
  const space = await prisma.space.findUnique({ where: { id: tokenGate.spaceId } });
  if (!space) {
    return;
  }

  const requirementsData = getDaylightRequirements(
    (tokenGate.conditions as any)?.unifiedAccessControlConditions as any
  );

  // "AND" operator is not yet supported by daylight
  if (!requirementsData.requirements.length || !DAYLIGHT_API_KEY || requirementsData.operator !== 'OR') {
    return;
  }

  const params = {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      requirements: requirementsData.requirements,
      requirementsLogic: requirementsData.operator,
      action: { linkUrl: getActionUrl(space.domain) },
      title: ` Join the ${space.name} Workspace on CharmVerse`,
      description:
        'We are using CharmVerse to coordinate tasks, host discussion, share documents and facilitate decisions. Join us.',
      type: 'access',
      isActive: true,
      sourceId: getAbilitySourceId(tokenGate.id)
    })
  };

  try {
    return await fetch('https://api.daylight.xyz/v1/abilities', params);
  } catch (e) {
    // eslint-disable-next-line no-empty
  }
}

export async function deleteDaylightAbility(sourceId: string) {
  if (!sourceId || !DAYLIGHT_API_KEY) {
    return;
  }

  const params = {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify({
      isActive: false
    })
  };

  try {
    const id = sourceId.startsWith(SOURCE_PREFIX) ? sourceId : getAbilitySourceId(sourceId);
    return await fetch(`https://api.daylight.xyz/v1/abilities/${id}`, params);
  } catch (e) {
    // eslint-disable-next-line no-empty
  }
}

export async function getAllAbilities() {
  const params = {
    method: 'GET',
    headers: HEADERS
  };

  return fetch<{ abilities: { sourceId: string; uid: string }[] }>(
    'https://api.daylight.xyz/v1/abilities/mine',
    params
  );
}

function getRequirement(condition: AccessControlCondition) {
  const accessType = getAccessType(condition);

  // Daylight currently supports only ethereum
  if (condition.chain !== 'ethereum') {
    return null;
  }

  switch (accessType) {
    case 'individual_wallet': {
      const addressValue = condition.returnValueTest?.value;
      if (!addressValue) {
        return null;
      }

      return {
        chain: condition.chain,
        type: 'onAllowlist',
        addresses: Array.isArray(addressValue) ? addressValue : [addressValue]
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
      const minAmount = Number(condition.returnValueTest.value);
      if (!condition.contractAddress || !condition.returnValueTest?.value || !minAmount) {
        return null;
      }

      return {
        chain: condition.chain,
        type: 'hasTokenBalance',
        address: condition.contractAddress,
        minAmount
      };
    }

    default: {
      return null;
    }
  }
}

export function getDaylightRequirements(conditionsData: TokenGateAccessConditions) {
  const conditionsFlatArr = flatten(conditionsData);

  const operators = conditionsFlatArr.filter((condition) => {
    return 'operator' in condition;
  }) as ConditionOperator[];

  const conditions = conditionsFlatArr.filter((condition) => {
    return 'chain' in condition;
  }) as AccessControlCondition[];

  const conditionsOperator: Operator = (operators[0]?.operator.toLocaleUpperCase() as Operator) || 'OR';

  if (conditions.length > 1 && operators.some((o) => o.operator !== operators[0].operator)) {
    // Daylight does not support multiple operators, do not proceed
    return { requirements: [], operator: conditionsOperator };
  }

  const requirements = conditions.map((condition) => getRequirement(condition));
  const hasInvalidRequirements = requirements.some((r) => r === null);

  return {
    requirements: hasInvalidRequirements ? [] : requirements,
    operator: conditionsOperator
  };
}

function getActionUrl(spaceDomain: string) {
  // Daylight will not allow to create ability with action url pointing to localhost
  // for testing we can sue our main domain
  const base = baseUrl?.includes('localhost') || !baseUrl ? 'https://app.charmverse.io' : baseUrl;

  return `${base}/join?domain=${spaceDomain}`;
}

function getAbilitySourceId(tokenGateId: string) {
  return `${SOURCE_PREFIX}${tokenGateId}`;
}
