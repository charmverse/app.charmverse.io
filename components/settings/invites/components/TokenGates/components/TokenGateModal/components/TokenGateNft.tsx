import { MenuItem, Select } from '@mui/material';
import { use, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { NumberInputField } from 'components/common/form/fields/NumberInputField';
import { TextInputField } from 'components/common/form/fields/TextInputField';

import type { FormValues } from '../hooks/useCollectablesForm';
import { nftCheck } from '../utils/utils';

import { TokenGateBlockchainSelect } from './TokenGateBlockchainSelect';

export function TokenGateNft() {
  const {
    register,
    watch,
    setValue,
    getValues,
    formState: { errors }
  } = useFormContext<FormValues>();
  const check = watch('check');
  const collectableOption = watch('collectableOption');

  useEffect(() => {
    if (check === 'group') {
      const quantity = getValues('quantity');
      if (!quantity) {
        setValue('quantity', '1', { shouldValidate: true });
      }
    }
  }, [check, collectableOption, getValues]);

  return (
    <>
      <TokenGateBlockchainSelect
        error={!!errors.chain?.message}
        helperMessage={errors.chain?.message}
        {...register('chain', {
          deps: ['contract']
        })}
      />
      <TextInputField
        label='Contract Address'
        error={errors.contract?.message}
        helperText={errors.contract?.message}
        {...register('contract', {
          deps: ['chain']
        })}
      />
      {collectableOption === 'ERC721' && (
        <FieldWrapper label='Select how would you like to customize the nft token gate'>
          <Select<FormValues['check']>
            displayEmpty
            fullWidth
            renderValue={(selected) => nftCheck.find((c) => c.id === selected)?.name || selected || 'Select...'}
            {...register('check')}
          >
            {nftCheck.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </Select>
        </FieldWrapper>
      )}
      {((collectableOption === 'ERC721' && check === 'individual') || collectableOption === 'ERC1155') && (
        <TextInputField
          label='Token Id'
          error={errors.tokenId?.message}
          helperText={errors.tokenId?.message}
          {...register('tokenId')}
        />
      )}
      {collectableOption === 'ERC721' && check === 'group' && (
        <NumberInputField
          disableArrows
          fullWidth
          label='Quantity'
          error={errors.quantity?.message}
          helperText={errors.quantity?.message}
          {...register('quantity')}
        />
      )}
    </>
  );
}
