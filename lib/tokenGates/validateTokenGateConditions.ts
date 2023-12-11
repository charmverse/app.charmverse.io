import * as yup from 'yup';

import type { TokenGate } from './interfaces';

const UnlockProtocolSchema = yup.object().shape({
  contract: yup.string().required(),
  chainId: yup.number().required()
});

const LitProtocolSchema = yup.object().shape({
  unifiedAccessControlConditions: yup.array().of(
    yup.object().shape({
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
    })
  )
});

export async function validateTokenGateConditions(tokenGate: TokenGate) {
  if (tokenGate.type === 'unlock') {
    await UnlockProtocolSchema.validate(tokenGate.conditions);
  } else {
    await LitProtocolSchema.validate(tokenGate.conditions);
  }
}
