import AddIcon from '@mui/icons-material/Add';
import type { AutocompleteProps, SxProps } from '@mui/material';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import type { PaymentMethod } from '@prisma/client';
import type { CryptoCurrency } from 'connectors';
import { CryptoCurrencies } from 'connectors';
import uniq from 'lodash/uniq';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';

import CustomERCTokenForm from 'components/common/form/CustomERCTokenForm';
import Modal from 'components/common/Modal';
import TokenLogo from 'components/common/TokenLogo';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { getTokenInfo, getTokenAndChainInfoFromPayments } from 'lib/tokens/tokenData';

export interface IInputSearchCryptoProps extends Omit<Partial<AutocompleteProps<string, true, true, true>>, 'onChange' | 'defaultValue' | 'value'> {
  onChange?: (value: CryptoCurrency) => void;
  onNewPaymentMethod?: (method: PaymentMethod) => void;
  defaultValue?: CryptoCurrency | string;
  value?: CryptoCurrency | string; // allow parent to override value
  hideBackdrop?: boolean; // hide backdrop when modal is open
  cryptoList?: (string | CryptoCurrency)[];
  chainId?: number; // allow passing this down to the 'new custom token' form
  sx?: SxProps;
}

const ADD_NEW_CUSTOM = 'ADD_NEW_CUSTOM';

export function InputSearchCrypto ({
  hideBackdrop,
  onNewPaymentMethod: _onNewPaymentMethod,
  onChange = () => {},
  defaultValue = '',
  value: parentValue,
  cryptoList = CryptoCurrencies,
  chainId,
  sx = {},
  disabled,
  readOnly
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

  function emitValue (received: string) {
    if (received && cryptoList.includes(received as CryptoCurrency)) {
      setValue(received);
      onChange(received as CryptoCurrency);
    }
  }

  const cryptoOptions = uniq([...cryptoList, ADD_NEW_CUSTOM]);

  function onNewPaymentMethod (method: PaymentMethod) {
    ERC20PopupState.close();
    if (_onNewPaymentMethod) {
      _onNewPaymentMethod(method);
    }
  }

  return (
    <>
      <Autocomplete
        sx={{ minWidth: 150, ...sx }}
        onChange={(_, _value, reason) => {
          if (_value === ADD_NEW_CUSTOM) {
            if (reason === 'selectOption') {
              ERC20PopupState.open();
            }
          }
          else {
            emitValue(_value as any);
          }
        }}
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
          return getTokenInfo(paymentMethods, option).tokenSymbol;
        }}
        renderOption={(props, option) => {
          if (option === ADD_NEW_CUSTOM) {
            return (
              <Box component='li' {...props}>
                <AddIcon color='secondary' sx={{ mr: '5px' }} />
                <Typography variant='body2'>Add a custom token</Typography>
              </Box>
            );
          }
          const tokenInfo = getTokenAndChainInfoFromPayments({ methods: paymentMethods, chainId: 1, symbolOrAddress: option });

          return (
            <Box component='li' sx={{ '& > img': { flexShrink: 0 }, display: 'flex', gap: 1, alignItems: 'center' }} {...props}>
              <Box display='inline-block' width={20}>
                <TokenLogo height={20} src={tokenInfo.canonicalLogo} />
              </Box>
              <Box component='span'>
                {tokenInfo.tokenSymbol}
              </Box>
              <Box component='span'>
                {tokenInfo.tokenName}
              </Box>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
          />
        )}
        disabled={disabled}
        readOnly={readOnly}
      />

      <Modal title='Add a custom ERC20 token' hideBackdrop={hideBackdrop} open={ERC20PopupState.isOpen} onClose={ERC20PopupState.close} size='500px'>
        <CustomERCTokenForm defaultChainId={chainId} onSubmit={onNewPaymentMethod} />
      </Modal>
    </>
  );
}

