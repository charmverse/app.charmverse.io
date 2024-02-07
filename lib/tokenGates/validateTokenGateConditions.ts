import { InvalidInputError } from '@charmverse/core/errors';
import * as yup from 'yup';

import { isValidChainAddress } from 'lib/tokens/validation';

import type { TokenGate } from './interfaces';

const StandardProtocolSchema = yup.object().shape({
  contract: yup
    .string()
    .required()
    .test('isAddress', 'Invalid address', (value) => isValidChainAddress(value)),
  chainId: yup.number().required()
});

const AccConditions = yup.object().shape({
  chain: yup.string().required(),
  method: yup.string(),
  parameters: yup.array().of(yup.string()),
  conditionType: yup.string().required(),
  contractAddress: yup.string(),
  returnValueTest: yup.object().shape({
    value: yup.string().required(),
    comparator: yup.string().required()
  }),
  standardContractType: yup.string()
});

const OperatorConditions = yup.object().shape({
  operator: yup.string().required()
});

const LitProtocolSchema = yup.object().shape({
  unifiedAccessControlConditions: yup
    .array()
    .min(1, 'At least one condition is required')
    .required()
    .of(
      yup.object().test('isValidCondition', 'Invalid object', async (value) => {
        if ('operator' in value) {
          await OperatorConditions.validate(value);
          return true;
        } else {
          await AccConditions.validate(value);
          return true;
        }
      })
    )
});

export async function validateTokenGateConditions(tokenGate: TokenGate) {
  if (tokenGate.type === 'unlock' || tokenGate.type === 'hypersub') {
    await StandardProtocolSchema.validate(tokenGate.conditions);
  } else if (tokenGate.type === 'lit') {
    await LitProtocolSchema.validate(tokenGate.conditions);
  } else {
    throw new InvalidInputError('Invalid token gate type');
  }
}
