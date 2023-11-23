import { yupResolver } from '@hookform/resolvers/yup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { CredentialData, ProposalCredential } from 'lib/credentials/schemas';
import { getAppApexDomain } from 'lib/utilities/domains/getAppApexDomain';

const schema = yup.object<Record<keyof ProposalCredential | 'recipient', yup.StringSchema>>({
  name: yup.string().required(),
  description: yup.string().required(),
  organization: yup.string().required(),
  status: yup.string().required(),
  url: yup.string().required(),
  recipient: yup.string().required()
});

type FormValues = yup.InferType<typeof schema>;

export function ProposalCredentialForm() {
  const { user } = useUser();
  const { space } = useCurrentSpace();
  const [isAttesting, setIsAttesting] = useState(false);
  const { account } = useWeb3Account();
  const { showMessage } = useSnackbar();

  async function attest(values: FormValues) {
    setIsAttesting(true);

    try {
      const attestResponse = await charmClient.credentials.attest({
        chainId: 10,
        credential: {
          type: 'proposal',
          data: values as ProposalCredential
        },
        recipient: values.recipient as string
      });

      showMessage(JSON.stringify(attestResponse), 'info');
    } catch (err: any) {
      showMessage(err?.message);
    } finally {
      setIsAttesting(false);
    }
  }

  const {
    register,
    setValue,
    trigger,
    getValues,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      organization: space?.name,
      name: 'RFG7: Tooling for 6551',
      description: 'Request for Grants 7: Tooling for 6551',
      status: 'applied',
      url: `${getAppApexDomain()}/${space?.domain}/proposals`,
      recipient: '0x9b56c451f593e1BF5E458A3ecaDfD3Ef17A36998'
    },
    // mode: 'onChange',
    resolver: yupResolver(schema)
  });

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValue(event.target.name as keyof FormValues, value);
    return trigger();
  };
  return (
    <form onSubmit={handleSubmit(attest)}>
      <Stack gap={2}>
        <Typography>
          CharmVerse can use your email address to let you know when there is a conversation or activity you should be
          part of.
        </Typography>
        <TextField
          {...register('recipient')}
          autoFocus
          error={!!errors.name}
          helperText={errors.name?.message}
          onChange={onChange}
        />
        <TextField
          {...register('name')}
          autoFocus
          error={!!errors.name}
          helperText={errors.name?.message}
          onChange={onChange}
        />
        <TextField
          {...register('description')}
          autoFocus
          error={!!errors.description}
          helperText={errors.description?.message}
          onChange={onChange}
        />
        <TextField
          {...register('organization')}
          autoFocus
          error={!!errors.name}
          helperText={errors.name?.message}
          onChange={onChange}
        />
        <TextField
          {...register('url')}
          autoFocus
          error={!!errors.name}
          helperText={errors.name?.message}
          onChange={onChange}
        />
        <TextField
          {...register('status')}
          autoFocus
          error={!!errors.name}
          helperText={errors.name?.message}
          placeholder='me@gmail.com'
          onChange={onChange}
        />
        <Stack flexDirection='row' gap={1} justifyContent='flex-end'>
          <Button
            loading={isAttesting}
            data-test='member-email-next'
            type='submit'
            disabled={Object.keys(errors).length !== 0}
          >
            Attest
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
