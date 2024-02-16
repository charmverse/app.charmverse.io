import yup from 'yup';

import type { TokenGate } from './interfaces';

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

const TokenGateConditionsSchema = yup.object().shape({
  accessControlConditions: yup
    .array()
    .min(1, 'At least one condition is required')
    .required()
    .of(
      yup.object().test('isValidCondition', 'Invalid object', async (value) => {
        await AccConditions.validate(value);
        return true;
      })
    )
});

export async function validateTokenGateConditions(tokenGate: TokenGate) {
  await TokenGateConditionsSchema.validate(tokenGate.conditions);
}
