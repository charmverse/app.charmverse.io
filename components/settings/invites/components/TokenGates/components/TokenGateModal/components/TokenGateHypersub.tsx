import { getChainList } from '@packages/blockchain/connectors/chains';
import { useFormContext } from 'react-hook-form';

import { TextInputField } from 'components/common/form/fields/TextInputField';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import type { FormValues } from '../hooks/useCollectablesForm';

import { TokenGateBlockchainSelect } from './TokenGateBlockchainSelect';

export function TokenGateHypersub() {
  const { space } = useCurrentSpace();
  const chains = getChainList({ enableTestnets: !!space?.enableTestnets }).filter((chain) => !!chain.hypersubNetwork);
  const {
    register,
    formState: { errors }
  } = useFormContext<FormValues>();

  return (
    <>
      <TokenGateBlockchainSelect
        error={!!errors.chain?.message}
        helperMessage={errors.chain?.message}
        chains={chains}
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
