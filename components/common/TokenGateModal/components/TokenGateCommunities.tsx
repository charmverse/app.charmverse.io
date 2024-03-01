import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { builderDaoChains, daoChains, hatsProtocolChains } from 'connectors/chains';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { NumberInputField } from 'components/common/form/fields/NumberInputField';
import { TextInputField } from 'components/common/form/fields/TextInputField';

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
  const check = watch('check');

  const { setDisplayedPage, handleTokenGate } = useTokenGateModal();

  const onSubmit = async () => {
    const values = getValues();
    const valueProps = getCommunitiesAccessControlConditions(values) || [];
    handleTokenGate({ conditions: { accessControlConditions: valueProps } });
    setDisplayedPage('review');
  };

  const onCancel = () => {
    setDisplayedPage('home');
    reset();
  };

  const chains = check === 'builder' ? builderDaoChains : check === 'moloch' ? daoChains : hatsProtocolChains;

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
      {check === 'guild' ? (
        <TextInputField
          label='Guild Id or Url'
          error={errors.guild?.message}
          helperText={errors.guild?.message}
          {...register('guild')}
        />
      ) : check ? (
        <>
          <TokenGateBlockchainSelect
            error={!!errors.chain?.message}
            helperMessage={errors.chain?.message}
            chains={chains}
            {...register('chain', {
              deps: ['check']
            })}
          />
          <TextInputField
            label='Contract Address'
            error={errors.contract?.message}
            helperText={errors.contract?.message}
            {...register('contract')}
          />
        </>
      ) : null}
      {check === 'hats' && (
        <NumberInputField
          label='Token id'
          error={errors.tokenId?.message}
          helperText={errors.tokenId?.message}
          disableArrows
          fullWidth
          {...register('tokenId')}
        />
      )}

      <TokenGateFooter onSubmit={onSubmit} onCancel={onCancel} isValid={isValid} />
    </>
  );
}
