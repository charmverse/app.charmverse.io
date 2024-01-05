import { hypersubChains } from 'connectors/chains';
import { useFormContext } from 'react-hook-form';

import { TextInputField } from 'components/common/form/fields/TextInputField';

import type { FormValues } from '../hooks/useCollectablesForm';

import { TokenGateBlockchainSelect } from './TokenGateBlockchainSelect';

export function TokenGateHypersub() {
  const {
    register,
    formState: { errors }
  } = useFormContext<FormValues>();

  return (
    <>
      <TokenGateBlockchainSelect
        error={!!errors.chain?.message}
        helperMessage={errors.chain?.message}
        chains={hypersubChains}
        {...register('chain', {
          deps: ['contract']
        })}
      />
      <TextInputField
        label='Hypersub Contract Address'
        error={errors.contract?.message}
        helperText={errors.contract?.message}
        {...register('contract', {
          deps: ['chain']
        })}
      />
    </>
  );
}
