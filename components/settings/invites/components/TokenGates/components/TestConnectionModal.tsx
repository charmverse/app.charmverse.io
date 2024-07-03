import { log } from '@charmverse/core/log';
import { yupResolver } from '@hookform/resolvers/yup';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Typography } from '@mui/material';
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
  message?: string;
  status?: 'loading' | 'error' | 'success';
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
    resolver: yupResolver(schema),
    defaultValues: {
      address: account || ''
    }
  });

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
          setTestResult({ message: 'Your address does not meet the requirements', status: 'error' });
        },
        onSuccess: () => {
          setTestResult({ status: 'success' });
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
      <DialogTitle onClose={props.onClose} sx={!testResult.message ? { padding: 0 } : {}}>
        <Box display='flex' gap={1} width={300} alignItems='center'>
          {testResult.status === 'success' && (
            <>
              <CheckCircleOutlineIcon color='success' fontSize='large' />
              Success
            </>
          )}
          {testResult.status === 'error' && (
            <>
              <ErrorOutlineIcon color='error' fontSize='large' />
              Access denied
            </>
          )}
          {testResult.status === 'loading' && (
            <>
              <CircularProgress size={24} />
              Loading
            </>
          )}
        </Box>
      </DialogTitle>
      {testResult.message && <Typography>{testResult.message}</Typography>}
      <TextInputField
        label='Wallet address'
        placeholder='0x0000000000000000000000000000000000000000'
        inputEndAdornment={
          <Button onClick={testAddress} disabled={isValid} size='small'>
            Test
          </Button>
        }
        {...register('address')}
      />
    </Modal>
  );
}
