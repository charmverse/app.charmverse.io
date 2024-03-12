import type { PaymentMethod } from '@charmverse/core/prisma';
import AddIcon from '@mui/icons-material/Add';
import type { AutocompleteProps, SxProps, Theme } from '@mui/material';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import type { CryptoCurrency } from 'connectors/chains';
import { CryptoCurrencies } from 'connectors/chains';
import uniq from 'lodash/uniq';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';

import CustomERCTokenForm from 'components/common/form/CustomERCTokenForm';
import Modal from 'components/common/Modal';
import TokenLogo from 'components/common/TokenLogo';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { getTokenInfo } from 'lib/tokens/tokenData';

export interface IInputSearchCryptoProps
  extends Omit<Partial<AutocompleteProps<string, true, true, true>>, 'onChange' | 'defaultValue' | 'value'> {
  onChange?: (value: CryptoCurrency) => void;
  onNewPaymentMethod?: (method: PaymentMethod) => void;
  defaultValue?: CryptoCurrency | string;
  value?: CryptoCurrency | string; // allow parent to override value
  hideBackdrop?: boolean; // hide backdrop when modal is open
  cryptoList?: (string | CryptoCurrency)[];
  chainId?: number; // allow passing this down to the 'new custom token' form
  sx?: SxProps<Theme>;
  variant?: 'standard' | 'outlined';
  placeholder?: string;
}

const ADD_NEW_CUSTOM = 'ADD_NEW_CUSTOM';

export function InputSearchCrypto({
  hideBackdrop,
  onNewPaymentMethod: _onNewPaymentMethod,
  onChange = () => {},
  defaultValue = '',
  value: parentValue,
  cryptoList = CryptoCurrencies,
  chainId,
  sx = {},
  disabled,
  readOnly,
  variant,
  placeholder
}: IInputSearchCryptoProps) {
  const [inputValue, setInputValue] = useState('');

  const [value, setValue] = useState(defaultValue);

  const [paymentMethods] = usePaymentMethods();

  const ERC20PopupState = usePopupState({ variant: 'popover', popupId: 'ERC20-popup' });

  useEffect(() => {
    setValue(defaultValue);
  }, [cryptoList]);

  useEffect(() => {
    if (parentValue) {
      setValue(parentValue);
    }
  }, [cryptoList, parentValue]);

  function emitValue(received: string) {
    if (received && cryptoList.includes(received as CryptoCurrency)) {
      setValue(received);
      onChange(received as CryptoCurrency);
    }
  }

  const cryptoOptions = uniq([...cryptoList, ADD_NEW_CUSTOM]);

  function onNewPaymentMethod(method: PaymentMethod) {
    ERC20PopupState.close();
    if (_onNewPaymentMethod) {
      _onNewPaymentMethod(method);
    }
  }

  return (
    <>
      <Autocomplete
        sx={{ minWidth: 150, ...sx }}
        forcePopupIcon={variant !== 'standard'}
        onChange={(_, _value, reason) => {
          if (_value === ADD_NEW_CUSTOM) {
            if (reason === 'selectOption') {
              ERC20PopupState.open();
            }
          } else {
            emitValue(_value as any);
          }
        }}
        data-test='token-list'
        value={value}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          if (newInputValue !== ADD_NEW_CUSTOM) {
            setInputValue(newInputValue);
          }
        }}
        options={cryptoOptions}
        disableClearable={true}
        autoHighlight
        size='small'
        getOptionLabel={(option) => {
          if (!option) {
            return '';
          }
          const tokenInfo = getTokenInfo({
            methods: paymentMethods,
            symbolOrAddress: option
          });
          return tokenInfo.tokenSymbol;
        }}
        renderOption={(props, option) => {
          if (option === ADD_NEW_CUSTOM) {
            return (
              <Box data-test='add-custom-token' component='li' {...props}>
                <AddIcon color='secondary' sx={{ mr: '5px' }} />
                <Typography variant='body2'>Add a custom token</Typography>
              </Box>
            );
          }
          const tokenInfo = getTokenInfo({
            methods: paymentMethods,
            symbolOrAddress: option
          });

          return (
            <Box
              component='li'
              sx={{ '& > img': { flexShrink: 0 }, display: 'flex', gap: 1, alignItems: 'center' }}
              {...props}
              data-test={`select-crypto-${option}`}
            >
              <Box display='inline-block' width={20}>
                <TokenLogo height={20} src={tokenInfo.canonicalLogo} />
              </Box>
              <Box component='span'>{tokenInfo.tokenSymbol}</Box>
              <Box component='span'>{tokenInfo.tokenName}</Box>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant={variant}
            InputProps={{
              ...params.InputProps,
              ...(variant === 'standard' && { disableUnderline: true }),
              placeholder
            }}
          />
        )}
        disabled={disabled}
        readOnly={readOnly}
      />

      <Modal
        data-test='custom-token-modal'
        title='Add a custom ERC20 token'
        hideBackdrop={hideBackdrop}
        open={ERC20PopupState.isOpen}
        onClose={ERC20PopupState.close}
        size='500px'
      >
        <CustomERCTokenForm defaultChainId={chainId} onSubmit={onNewPaymentMethod} />
      </Modal>
    </>
  );
}
