import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { CryptoCurrencies, CryptoCurrency } from 'connectors';
import Modal from 'components/common/Modal';
import { useEffect, useState } from 'react';
import uniq from 'lodash/uniq';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { PaymentMethod } from '@prisma/client';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import AddIcon from '@mui/icons-material/Add';
import { getTokenInfo } from 'lib/tokens/tokenData';
import CustomERCTokenForm from 'components/settings/payment-methods/components/CustomERCTokenForm';

export interface IInputSearchCryptoProps {
  onChange?: (value: CryptoCurrency) => void;
  onNewPaymentMethod?: (method: PaymentMethod) => void;
  defaultValue?: CryptoCurrency | string;
  value?: CryptoCurrency | string; // allow parent to override value
  hideBackdrop?: boolean; // hide backdrop when modal is open
  cryptoList?: Array<string | CryptoCurrency>;
  chainId?: number; // allow passing this down to the 'new custom token' form
}

const ADD_NEW_CUSTOM = 'ADD_NEW_CUSTOM';

export function InputSearchCrypto ({
  hideBackdrop,
  onNewPaymentMethod: _onNewPaymentMethod,
  onChange = () => {},
  defaultValue = '',
  value: parentValue,
  cryptoList = CryptoCurrencies,
  chainId
}: IInputSearchCryptoProps) {

  const [inputValue, setInputValue] = useState('');

  const [value, setValue] = useState(defaultValue);

  const [paymentMethods] = usePaymentMethods();

  const ERC20PopupState = usePopupState({ variant: 'popover', popupId: 'ERC20-popup' });

  useEffect(() => {
    setInputValue(defaultValue);
    setValue(defaultValue);
  }, [cryptoList]);

  useEffect(() => {
    if (parentValue) {
      setInputValue(parentValue);
      setValue(parentValue);
    }
  }, [cryptoList, parentValue]);

  function emitValue (received: string) {
    if (received !== null && cryptoList.indexOf(received as CryptoCurrency) >= 0) {
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
        sx={{ minWidth: 150 }}
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
          const tokenInfo = getTokenInfo(paymentMethods, option);
          return tokenInfo.tokenSymbol;
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
          const tokenInfo = getTokenInfo(paymentMethods, option);

          return (
            <Box component='li' sx={{ '& > img': { flexShrink: 0 }, display: 'flex', gap: 1, alignItems: 'center' }} {...props}>
              {
                tokenInfo.tokenLogo && (
                  <img
                    width='20px'
                    height='20px'
                    src={tokenInfo.tokenLogo}
                  />
                )
              }
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
      />

      <Modal title='Add a custom ERC20 token' hideBackdrop={hideBackdrop} open={ERC20PopupState.isOpen} onClose={ERC20PopupState.close} size='500px'>
        <CustomERCTokenForm defaultChainId={chainId} onSubmit={onNewPaymentMethod} />
      </Modal>
    </>
  );
}

