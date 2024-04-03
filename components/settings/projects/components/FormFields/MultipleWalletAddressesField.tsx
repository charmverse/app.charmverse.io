import MuiAddIcon from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { IconButton, Stack } from '@mui/material';

import { Button } from 'components/common/Button';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import { InputSearchBlockchain } from 'components/common/form/InputSearchBlockchain';
import type { AddressChainCombo } from 'lib/projects/interfaces';

export function MultipleWalletAddressesField({
  addressChainCombos,
  onChange,
  required,
  disabled,
  name
}: {
  addressChainCombos: AddressChainCombo[];
  required: boolean;
  disabled?: boolean;
  name: string;
  onChange?: (addressChainCombos: AddressChainCombo[]) => void;
}) {
  return (
    <Stack gap={1}>
      {addressChainCombos.map((addressChainCombo, index) => (
        <Stack flexDirection='row' gap={1} alignItems='center' key={`${index.toString()}.${addressChainCombo.chain}`}>
          <TextInputField
            label='Wallet Address'
            required={required}
            disabled={disabled}
            value={addressChainCombo.address}
            data-test={`project-field-${name}.address`}
            onChange={
              onChange
                ? (e) => {
                    const address = e.target.value;
                    onChange(
                      addressChainCombos.map((_addressChainCombo, i) =>
                        i === index ? { ..._addressChainCombo, address } : _addressChainCombo
                      )
                    );
                  }
                : undefined
            }
          />
          <FieldWrapper
            required={required}
            label='Chain'
            inputEndAdornment={
              index !== 0 &&
              onChange && (
                <IconButton
                  size='small'
                  onClick={() => {
                    onChange(addressChainCombos.filter((_, i) => i !== index));
                  }}
                >
                  <DeleteOutlineOutlinedIcon color='error' fontSize='small' />
                </IconButton>
              )
            }
          >
            <InputSearchBlockchain
              disabled={disabled}
              chainId={addressChainCombo.chain}
              onChange={
                onChange
                  ? (chain) => {
                      onChange(
                        addressChainCombos.map((_addressChainCombo, i) =>
                          i === index ? { ..._addressChainCombo, chain } : _addressChainCombo
                        )
                      );
                    }
                  : undefined
              }
            />
          </FieldWrapper>
        </Stack>
      ))}
      <Button
        onClick={
          onChange
            ? () => {
                onChange([
                  ...addressChainCombos,
                  {
                    chain: 1,
                    address: ''
                  }
                ]);
              }
            : undefined
        }
        variant='text'
        disabled={disabled}
        size='small'
        sx={{
          width: 'fit-content'
        }}
        startIcon={<MuiAddIcon fontSize='small' />}
      >
        Add another wallet address
      </Button>
    </Stack>
  );
}
