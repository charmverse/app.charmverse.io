import type { PaymentMethod } from '@charmverse/core/prisma';
import AddIcon from '@mui/icons-material/Add';
import type { AutocompleteProps, SxProps, Theme } from '@mui/material';
import { Autocomplete, Box, Stack, TextField, Typography } from '@mui/material';
import type { CryptoCurrency } from 'connectors/chains';
import { CryptoCurrencies, getChainById } from 'connectors/chains';
import uniq from 'lodash/uniq';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';

import CustomERCTokenForm from 'components/common/form/CustomERCTokenForm';
import Modal from 'components/common/Modal';
import TokenLogo from 'components/common/TokenLogo';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { getTokenInfo } from 'lib/tokens/tokenData';

type CryptoValue = string | CryptoCurrency | { chainId: number; tokenAddress: string };

interface IInputSearchCryptoProps<Value extends CryptoValue>
  extends Omit<Partial<AutocompleteProps<Value, true, true, true>>, 'onChange' | 'defaultValue' | 'value'> {
  onChange?: (value: Value) => void;
  onNewPaymentMethod?: (method: PaymentMethod) => void;
  defaultValue?: Value;
  value?: Value; // allow parent to override value
  hideBackdrop?: boolean; // hide backdrop when modal is open
  cryptoList?: Value[];
  chainId?: number; // allow passing this down to the 'new custom token' form
  sx?: SxProps<Theme>;
  variant?: 'standard' | 'outlined';
  placeholder?: string;
  showChain?: boolean;
}

const ADD_NEW_CUSTOM = 'ADD_NEW_CUSTOM';

export function InputSearchCrypto<Value extends CryptoValue>({
  hideBackdrop,
  onNewPaymentMethod: _onNewPaymentMethod,
  onChange = () => {},
  defaultValue,
  value: parentValue,
  cryptoList = CryptoCurrencies as Value[],
  chainId,
  sx = {},
  disabled,
  readOnly,
  variant,
  placeholder,
  showChain
}: IInputSearchCryptoProps<Value>) {
  const [inputValue, setInputValue] = useState('');

  const [value, setValue] = useState(defaultValue);

  const [paymentMethods] = usePaymentMethods();

  const ERC20PopupState = usePopupState({ variant: 'popover', popupId: 'ERC20-popup' });

  function getOptionLabel(option: Value | string) {
    if (!option || option === ADD_NEW_CUSTOM) {
      return '';
    }
    const tokenInfo = getTokenInfo({
      methods: paymentMethods,
      symbolOrAddress: typeof option === 'object' ? option.tokenAddress : option
    });

    const chain = tokenInfo.chain;
    if (chain && showChain) {
      return `${tokenInfo.tokenSymbol} on ${chain.chainName}`;
    }
    return tokenInfo.tokenSymbol;
  }

  useEffect(() => {
    setValue(defaultValue);
  }, [cryptoList]);

  useEffect(() => {
    if (parentValue) {
      setValue(parentValue);
    }
  }, [cryptoList, parentValue]);

  function emitValue(received: Value) {
    if (received && cryptoList.includes(received)) {
      setValue(received);
      onChange(received);
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
      <Autocomplete<Value, false, true, true>
        sx={{ minWidth: 150, ...sx }}
        forcePopupIcon={variant !== 'standard'}
        onChange={(_, _value, reason) => {
          if (_value !== ADD_NEW_CUSTOM) {
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
        options={cryptoOptions as Value[]}
        disableClearable
        autoComplete={false}
        autoHighlight
        size='small'
        getOptionLabel={getOptionLabel}
        renderOption={(props, option) => {
          if (option === ADD_NEW_CUSTOM) {
            return (
              <Box data-test='add-custom-token' component='li' {...props} onClick={ERC20PopupState.open}>
                <AddIcon color='secondary' sx={{ mr: '5px' }} />
                <Typography variant='body2'>Add a custom token</Typography>
              </Box>
            );
          }
          const chain = showChain && typeof option === 'object' ? getChainById(option.chainId) : null;
          const tokenInfo = getTokenInfo({
            methods: paymentMethods,
            symbolOrAddress: typeof option === 'object' ? option.tokenAddress : option
          });

          return (
            <Stack
              {...props}
              component='li'
              sx={{ '& > img': { flexShrink: 0 }, display: 'flex' }}
              data-test={`select-crypto-${option}`}
            >
              <Stack alignItems='center' flexDirection='row' gap={1} alignSelf='flex-start'>
                <Box display='inline-block' width={20}>
                  <TokenLogo height={20} src={tokenInfo.canonicalLogo} />
                </Box>
                <Stack>
                  <Stack flexDirection='row' gap={1}>
                    <Box component='span'>{tokenInfo.tokenSymbol}</Box>
                    <Box component='span'>{tokenInfo.tokenName}</Box>
                  </Stack>
                  {chain ? (
                    <Typography
                      variant='subtitle2'
                      fontWeight='bold'
                      component='span'
                      sx={{
                        alignSelf: 'flex-start'
                      }}
                    >
                      {chain.chainName}
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>
            </Stack>
          );
        }}
        renderInput={(params) => {
          const tokenInfo = value
            ? getTokenInfo({
                methods: paymentMethods,
                symbolOrAddress: typeof value === 'object' ? value.tokenAddress : value
              })
            : null;
          return (
            <TextField
              {...params}
              variant={variant}
              InputProps={{
                ...params.InputProps,
                ...(variant === 'standard' && { disableUnderline: true }),
                placeholder,
                startAdornment: tokenInfo ? <TokenLogo height={20} src={tokenInfo.canonicalLogo} /> : null
              }}
            />
          );
        }}
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
