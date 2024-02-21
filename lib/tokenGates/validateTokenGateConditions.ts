import { getChainById } from 'connectors/chains';
import { isAddress } from 'viem';
import * as yup from 'yup';

import type { TokenGate, AccessType, ConditionType, Method } from './interfaces';

const AccessControlSchema = yup.object().shape({
  chain: yup
    .number()
    .required()
    .test('isChainId', 'Invalid chain id', (value) => !!getChainById(Number(value))),
  condition: yup
    .string<ConditionType>()
    .required()
    .test('isConditionType', 'Invalid condition type', (value) => ['sol', 'evm'].includes(value)),
  type: yup.string<AccessType>().required(),
  contractAddress: yup
    .string()
    .test('isContractAddress', 'Invalid contract address', (value) => (value ? isAddress(value) : true)),
  method: yup.string<Method>(),
  tokenIds: yup.array().of(yup.string()),
  quantity: yup.string().required()
});

const TokenGateConditionsSchema = yup.object().shape({
  conditions: yup.object().shape({
    accessControlConditions: yup
      .array()
      .min(1, 'At least one condition is required')
      .of(
        yup.object().test('isValidCondition', 'Invalid object', async (value) => {
          await AccessControlSchema.validate(value);
          return true;
        })
      )
  })
});

export async function validateTokenGateConditions(tokenGate: TokenGate) {
  await TokenGateConditionsSchema.validate(tokenGate.conditions);
}
