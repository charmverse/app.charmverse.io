import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { builderDaoChains, daoChains, hatsProtocolChains, getChainList } from '@packages/blockchain/connectors/chains';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { guild } from '@packages/lib/guild-xyz/client';

import type { FormValues } from '../hooks/useCommunitiesForm';
import { useCommunitiesForm } from '../hooks/useCommunitiesForm';
import { useTokenGateModal } from '../hooks/useTokenGateModalContext';
import { getCommunitiesAccessControlConditions } from '../utils/getCommunitiesAccessControlConditions';
import { daoCheck } from '../utils/utils';

import { TokenGateBlockchainSelect } from './TokenGateBlockchainSelect';
import { TokenGateFooter } from './TokenGateFooter';

export function TokenGateCommunities() {
  const {
    register,
    getValues,
    watch,
    formState: { errors, isValid },
    reset
  } = useCommunitiesForm();
  const { space } = useCurrentSpace();
  const { setDisplayedPage, handleTokenGate } = useTokenGateModal();
  const check = watch('check');
  const communityChains = check === 'builder' ? builderDaoChains : check === 'moloch' ? daoChains : hatsProtocolChains;
  const chains = getChainList({ enableTestnets: !!space?.enableTestnets }).filter((chain) =>
    communityChains.includes(chain.shortName)
  );

  const onSubmit = async () => {
    let values = getValues();
    if (values.guild) {
      const guildId = await guild
        .get(values.guild)
        .then((data) => data?.id?.toString() || values.guild)
        .catch(() => null);
      values = { ...values, guild: guildId || values.guild };
    }
    const valueProps = getCommunitiesAccessControlConditions(values) || [];
    handleTokenGate({ conditions: { accessControlConditions: valueProps } });
    setDisplayedPage('review');
  };

  const onCancel = () => {
    setDisplayedPage('home');
    reset();
  };

  return (
    <>
      <FieldWrapper label='Select Community Membership'>
        <Select<FormValues['check']>
          displayEmpty
          fullWidth
          renderValue={(selected) => daoCheck.find((c) => c.id === selected)?.name || selected || 'Select...'}
          {...register('check', {
            deps: ['chain']
          })}
        >
          {daoCheck.map((type) => (
            <MenuItem key={type.id} value={type.id}>
              {type.name}
            </MenuItem>
          ))}
        </Select>
      </FieldWrapper>
      {check === 'guild' && (
        <TextInputField
          label='Guild Id or Url'
          error={errors.guild?.message}
          helperText={errors.guild?.message}
          {...register('guild')}
        />
      )}
      {['builder', 'moloch', 'hats'].includes(check) && (
        <TokenGateBlockchainSelect
          error={!!errors.chain?.message}
          helperMessage={errors.chain?.message}
          chains={chains}
          {...register('chain', {
            deps: ['check']
          })}
        />
      )}
      {['builder', 'moloch'].includes(check) && (
        <TextInputField
          label='Contract Address'
          error={errors.contract?.message}
          helperText={errors.contract?.message}
          {...register('contract')}
        />
      )}
      {check === 'hats' && (
        <TextInputField
          label='Hats id'
          placeholder='0x000000000000000000000000000000000000000000000000000000000000000'
          error={errors.tokenId?.message}
          helperText={errors.tokenId?.message}
          {...register('tokenId')}
        />
      )}

      <TokenGateFooter onSubmit={onSubmit} onCancel={onCancel} isValid={isValid} />
    </>
  );
}
