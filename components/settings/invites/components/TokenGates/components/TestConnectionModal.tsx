import { log } from '@charmverse/core/log';
import { yupResolver } from '@hookform/resolvers/yup';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Stack, TextField, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useTestTokenGate } from 'charmClient/hooks/tokenGates';
import { Button } from 'components/common/Button';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import { DialogTitle, Modal } from 'components/common/Modal';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { TokenGate, TokenGateWithRoles } from 'lib/tokenGates/interfaces';
import { isValidChainAddress } from 'lib/tokens/validation';

type TestResult = {
  status?: 'loading' | 'error' | 'success' | 'token_gate_error';
};
type Props = Omit<ComponentProps<typeof Modal>, 'children'> & { tokenGateId?: string; onClose: VoidFunction };

const schema = yup.object({
  address: yup
    .string()
    .required('Contract is required')
    .test('isAddress', 'Invalid address', (value) => isValidChainAddress(value))
});

export function TestConnectionModal({ tokenGateId, ...props }: Props) {
  const [testResult, setTestResult] = useState<TestResult>({});
  const { trigger: verifyTokenGate } = useTestTokenGate();
  const { account } = useWeb3Account();

  const {
    register,
    formState: { isValid },
    getValues
  } = useForm<{ address: string }>({
    mode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues: {
      address: account || ''
    }
  });

  const addressInput = register('address');

  async function testAddress() {
    const address = getValues().address;
    if (!address || !tokenGateId) {
      return;
    }
    setTestResult({ status: 'loading' });

    await verifyTokenGate(
      {
        address,
        tokenGateId
      },
      {
        // unexepcted error, maybe
        onError: (error) => {
          log.warn('Unexpected error when testing token gate', error);
          setTestResult({ status: 'token_gate_error' });
        },
        onSuccess: (result) => {
          if (result.success) {
            setTestResult({ status: 'success' });
          } else {
            setTestResult({ status: 'error' });
          }
        }
      }
    );
  }

  useEffect(() => {
    // run initially when token gate is set [and the modal is open]
    if (tokenGateId) {
      testAddress();
    }
  }, [tokenGateId]);

  return (
    <Modal size='fluid' {...props}>
      <Box width='550px' maxWidth='100%'>
        <DialogTitle onClose={props.onClose}>Test token gate</DialogTitle>
        <Stack alignItems='flex-start' flexDirection='row'>
          <TextField
            fullWidth
            error={testResult.status === 'error'}
            helperText={
              <>
                {testResult.status === 'loading' && (
                  <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }} variant='caption'>
                    <CircularProgress size={10} />
                    Loading...
                  </Typography>
                )}
                {testResult.status === 'success' && (
                  <Typography
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    variant='caption'
                    color='success.main'
                  >
                    <CheckCircleOutlineIcon color='success' fontSize='small' />
                    The address meets the requirements
                  </Typography>
                )}
                {testResult.status === 'token_gate_error' && (
                  <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} variant='caption' color='error'>
                    <ErrorOutlineIcon color='error' fontSize='small' />
                    Unknown error. Check token gate conditions
                  </Typography>
                )}
                {testResult.status === 'error' && (
                  <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} variant='caption' color='error'>
                    <ErrorOutlineIcon color='error' />
                    The address does not meet the requirements
                  </Typography>
                )}
              </>
            }
            placeholder='0x0000000000000000000000000000000000000000'
            {...addressInput}
            onChange={(e) => {
              // clear out results if address is changed
              setTestResult({});
              addressInput.onChange(e);
            }}
          />
          <Button
            size='large'
            sx={{ py: '6px' }}
            variant='outlined'
            color='secondary'
            onClick={testAddress}
            disabled={!isValid}
          >
            Test again
          </Button>
        </Stack>
        {/* <TextInputField
          label='Wallet address'
          error={testResult.status === 'error' ? 'Invalid address' : undefined}
          placeholder='0x0000000000000000000000000000000000000000'
          inputEndAdornment={}
          inputEndAdornmentAlignItems='flex-start'
          {...addressInput}
          onChange={(e) => {
            // clear out results if address is changed
            setTestResult({});
            addressInput.onChange(e);
          }}
        /> */}
      </Box>
    </Modal>
  );
}
