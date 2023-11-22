import {
  FormControlLabel,
  FormHelperText,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Radio,
  RadioGroup,
  Select
} from '@mui/material';
import { getChainDetailsFromLitNetwork, litChainList } from 'connectors/chains';
import { Controller, useFormContext } from 'react-hook-form';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { NumberInputField } from 'components/common/form/fields/NumberInputField';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import TokenLogo from 'components/common/TokenLogo';

import type { FormValues } from '../hooks/useCollectablesForm';
import { nftCheck } from '../utils/utils';

export function TokengateNft() {
  const {
    register,
    watch,
    control,
    formState: { errors }
  } = useFormContext<FormValues>();
  const check = watch('check');
  const collectableOption = watch('collectableOption');

  return (
    <>
      <FieldWrapper label='Blockchain'>
        <Select<FormValues['chain']>
          fullWidth
          displayEmpty
          error={!!errors.chain?.message}
          renderValue={(selected) => getChainDetailsFromLitNetwork(selected)?.chainName || selected || 'Select a Chain'}
          {...register('chain')}
        >
          {litChainList.map((_chain) => (
            <MenuItem key={_chain.chainName} value={_chain.litNetwork}>
              <ListItemIcon>
                <TokenLogo height={20} src={_chain.iconUrl} />
              </ListItemIcon>
              <ListItemText>{_chain.chainName}</ListItemText>
            </MenuItem>
          ))}
        </Select>
        {errors.chain?.message && <FormHelperText>{errors.chain?.message}</FormHelperText>}
      </FieldWrapper>
      <TextInputField
        label='Contract Address'
        error={errors.contract?.message}
        helperText={errors.contract?.message}
        {...register('contract')}
      />
      {collectableOption === 'ERC721' && (
        <FieldWrapper label='Select how would you like to customize the nft token gate'>
          <Controller
            control={control}
            name='check'
            render={({ field: { onChange, value } }) => (
              <RadioGroup aria-labelledby='radio-buttons-for-nfts' onChange={onChange} value={value}>
                {nftCheck.map((c) => (
                  <FormControlLabel key={c.id} value={c.id} control={<Radio />} label={c.name} />
                ))}
              </RadioGroup>
            )}
          />
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
          label='Quantity'
          error={errors.quantity?.message}
          helperText={errors.quantity?.message}
          {...register('quantity')}
        />
      )}
    </>
  );
}
