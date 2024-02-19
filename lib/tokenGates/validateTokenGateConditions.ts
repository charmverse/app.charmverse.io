import yup from 'yup';

import type { TokenGate, AccessType, ConditionType, Method } from './interfaces';

const schema = yup.object().shape({
  chain: yup.number().required(),
  condition: yup.string<ConditionType>().required(),
  type: yup.string<AccessType>(),
  contractAddress: yup.string(),
  method: yup.string<Method>(),
  tokenIds: yup.array().of(yup.string()),
  quantity: yup.string()
});

const TokenGateConditionsSchema = yup.object().shape({
  accessControlConditions: yup
    .array()
    .min(1, 'At least one condition is required')
    .required()
    .of(
      yup.object().test('isValidCondition', 'Invalid object', async (value) => {
        await schema.validate(value);
        return true;
      })
    )
});

export async function validateTokenGateConditions(tokenGate: TokenGate) {
  await TokenGateConditionsSchema.validate(tokenGate.conditions);
}
