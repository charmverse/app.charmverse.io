import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { gitcoinPassportCheck } from '../utils/utils';

const gitcoinCheck = gitcoinPassportCheck.map((c) => c.id);

const schema = yup.object({
  check: yup.string().required().oneOf(gitcoinCheck),
  score: yup.string().required()
});

export type FormValues = yup.InferType<typeof schema>;

const defaultValues: FormValues = { score: '0', check: '' as FormValues['check'] };

export function useCredentialsForm() {
  const methods = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues
  });

  return methods;
}
